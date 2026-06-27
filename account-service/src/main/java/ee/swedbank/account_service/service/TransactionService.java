package ee.swedbank.account_service.service;

import ee.swedbank.account_service.entity.Account;
import ee.swedbank.account_service.entity.Transaction;
import ee.swedbank.account_service.exception.AccountNotFoundException;
import ee.swedbank.account_service.exception.ForbiddenException;
import ee.swedbank.account_service.repository.AccountRepository;
import ee.swedbank.account_service.repository.TransactionRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

  private final AccountRepository accountRepository;
  private final TransactionRepository transactionRepository;

  @Transactional(readOnly = true)
  public Page<Transaction> getTransactionHistory(
      UUID accountId, int page, int size, UUID requestingUserId) {
    log.debug("Fetching transaction history for account {} page={} size={}", accountId, page, size);
    Account account =
        accountRepository
            .findById(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));
    if (!account.getUser().getId().equals(requestingUserId)) {
      throw new ForbiddenException("Account does not belong to the current user");
    }
    return transactionRepository.findByAccountIdOrderByCreatedAtDesc(
        accountId, PageRequest.of(page, size));
  }
}
