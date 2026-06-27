package ee.swedbank.account_service.service;

import ee.swedbank.account_service.entity.Account;
import ee.swedbank.account_service.entity.Currency;
import ee.swedbank.account_service.entity.Transaction;
import ee.swedbank.account_service.entity.TransactionType;
import ee.swedbank.account_service.entity.User;
import ee.swedbank.account_service.exception.*;
import ee.swedbank.account_service.model.ExchangeResult;
import ee.swedbank.account_service.repository.AccountRepository;
import ee.swedbank.account_service.repository.TransactionRepository;
import ee.swedbank.account_service.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

  private final UserRepository userRepository;
  private final AccountRepository accountRepository;
  private final TransactionRepository transactionRepository;
  private final ExchangeRateService exchangeRateService;
  private final ExternalAuditClient externalAuditClient;
  private final TransactionTemplate transactionTemplate;

  @Transactional
  public Account createAccount(UUID requestingUserId, Currency currency) {
    log.info("Creating {} account for user {}", currency, requestingUserId);
    User user =
        userRepository
            .findById(requestingUserId)
            .orElseThrow(() -> new UserNotFoundException(requestingUserId));
    Account account =
        accountRepository.save(Account.builder().user(user).currency(currency).build());
    log.info("Account {} ({}) created for user {}", account.getId(), currency, requestingUserId);
    return account;
  }

  @Transactional(readOnly = true)
  public List<Account> getUserAccounts(UUID userId, UUID requestingUserId) {
    log.debug("Fetching accounts for user {}", userId);
    if (!userId.equals(requestingUserId)) {
      throw new ForbiddenException("Cannot access accounts of another user");
    }
    if (!userRepository.existsById(userId)) {
      throw new UserNotFoundException(userId);
    }
    return accountRepository.findByUserId(userId);
  }

  @Transactional(readOnly = true)
  public Account getAccount(UUID accountId, UUID requestingUserId) {
    log.debug("Fetching account {} for user {}", accountId, requestingUserId);
    Account account =
        accountRepository
            .findById(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));
    requireOwnership(account, requestingUserId);
    return account;
  }

  @Transactional
  public Transaction deposit(
      UUID accountId, BigDecimal amount, String description, UUID requestingUserId) {
    log.info("Depositing {} into account {}", amount, accountId);
    Account account =
        accountRepository
            .findByIdWithLock(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));
    requireOwnership(account, requestingUserId);

    account.setBalance(account.getBalance().add(amount));
    accountRepository.save(account);
    log.info(
        "Deposit complete: account {} new balance={} {}",
        accountId,
        account.getBalance(),
        account.getCurrency());

    return transactionRepository.save(
        Transaction.builder()
            .account(account)
            .type(TransactionType.DEPOSIT)
            .amount(amount)
            .currency(account.getCurrency())
            .balanceAfter(account.getBalance())
            .description(description)
            .build());
  }

  public Transaction withdraw(
      UUID accountId, BigDecimal amount, String description, UUID requestingUserId) {
    log.info("Withdrawing {} from account {}", amount, accountId);
    Account account = validateWithdrawal(accountId, amount, requestingUserId);
    externalAuditClient.notifyDebit(accountId, amount, account.getCurrency().name());
    return executeDebit(accountId, amount, description);
  }

  private Account validateWithdrawal(UUID accountId, BigDecimal amount, UUID requestingUserId) {
    Account account =
        accountRepository
            .findById(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));
    requireOwnership(account, requestingUserId);
    if (account.getBalance().compareTo(amount) < 0) {
      log.warn(
          "Insufficient funds on account {}: balance={} requested={}",
          accountId,
          account.getBalance(),
          amount);
      throw new InsufficientFundsException(accountId, account.getBalance(), amount);
    }
    return account;
  }

  private Transaction executeDebit(UUID accountId, BigDecimal amount, String description) {
    return transactionTemplate.execute(
        _ -> {
          Account locked =
              accountRepository
                  .findByIdWithLock(accountId)
                  .orElseThrow(() -> new AccountNotFoundException(accountId));
          if (locked.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException(accountId, locked.getBalance(), amount);
          }
          locked.setBalance(locked.getBalance().subtract(amount));
          accountRepository.save(locked);
          log.info(
              "Withdrawal complete: account {} new balance={} {}",
              accountId,
              locked.getBalance(),
              locked.getCurrency());
          return transactionRepository.save(
              Transaction.builder()
                  .account(locked)
                  .type(TransactionType.WITHDRAWAL)
                  .amount(amount)
                  .currency(locked.getCurrency())
                  .balanceAfter(locked.getBalance())
                  .description(description)
                  .build());
        });
  }

  @Transactional
  public ExchangeResult exchange(
      UUID sourceAccountId, UUID targetAccountId, BigDecimal amount, UUID requestingUserId) {
    log.info(
        "Exchange requested: {} from account {} to account {}",
        amount,
        sourceAccountId,
        targetAccountId);
    // Lock accounts in ascending UUID order to prevent deadlocks
    Account source;
    Account target;
    if (sourceAccountId.compareTo(targetAccountId) < 0) {
      source =
          accountRepository
              .findByIdWithLock(sourceAccountId)
              .orElseThrow(() -> new AccountNotFoundException(sourceAccountId));
      target =
          accountRepository
              .findByIdWithLock(targetAccountId)
              .orElseThrow(() -> new AccountNotFoundException(targetAccountId));
    } else {
      target =
          accountRepository
              .findByIdWithLock(targetAccountId)
              .orElseThrow(() -> new AccountNotFoundException(targetAccountId));
      source =
          accountRepository
              .findByIdWithLock(sourceAccountId)
              .orElseThrow(() -> new AccountNotFoundException(sourceAccountId));
    }

    requireOwnership(source, requestingUserId);
    requireOwnership(target, requestingUserId);

    if (source.getCurrency() == target.getCurrency()) {
      log.warn(
          "Exchange rejected: source and target accounts have the same currency ({})",
          source.getCurrency());
      throw new InvalidExchangeException(
          "Source and target accounts must have different currencies");
    }
    if (source.getBalance().compareTo(amount) < 0) {
      log.warn(
          "Insufficient funds for exchange on account {}: balance={} requested={}",
          sourceAccountId,
          source.getBalance(),
          amount);
      throw new InsufficientFundsException(sourceAccountId, source.getBalance(), amount);
    }

    BigDecimal rate = exchangeRateService.getRate(source.getCurrency(), target.getCurrency());
    BigDecimal convertedAmount =
        exchangeRateService.convert(amount, source.getCurrency(), target.getCurrency());

    source.setBalance(source.getBalance().subtract(amount));
    target.setBalance(target.getBalance().add(convertedAmount));
    accountRepository.save(source);
    accountRepository.save(target);

    String description =
        "%s %s → %s %s"
            .formatted(
                amount.stripTrailingZeros().toPlainString(), source.getCurrency(),
                convertedAmount.stripTrailingZeros().toPlainString(), target.getCurrency());

    Transaction sourceTx =
        transactionRepository.save(
            Transaction.builder()
                .account(source)
                .type(TransactionType.EXCHANGE_OUT)
                .amount(amount)
                .currency(source.getCurrency())
                .balanceAfter(source.getBalance())
                .description(description)
                .build());

    Transaction targetTx =
        transactionRepository.save(
            Transaction.builder()
                .account(target)
                .type(TransactionType.EXCHANGE_IN)
                .amount(convertedAmount)
                .currency(target.getCurrency())
                .balanceAfter(target.getBalance())
                .description(description)
                .build());

    log.info(
        "Exchange complete: {} {} → {} {} (rate={}) source balance={} target balance={}",
        amount,
        source.getCurrency(),
        convertedAmount,
        target.getCurrency(),
        rate,
        source.getBalance(),
        target.getBalance());
    return new ExchangeResult(sourceTx, targetTx, rate);
  }

  private void requireOwnership(Account account, UUID requestingUserId) {
    if (!account.getUser().getId().equals(requestingUserId)) {
      throw new ForbiddenException("Account does not belong to the current user");
    }
  }
}
