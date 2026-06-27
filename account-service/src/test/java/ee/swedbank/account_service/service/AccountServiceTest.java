package ee.swedbank.account_service.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import ee.swedbank.account_service.entity.*;
import ee.swedbank.account_service.exception.*;
import ee.swedbank.account_service.model.ExchangeResult;
import ee.swedbank.account_service.repository.*;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private AccountRepository accountRepository;
  @Mock private TransactionRepository transactionRepository;
  @Mock private ExchangeRateService exchangeRateService;
  @Mock private ExternalAuditClient externalAuditClient;
  @Mock private TransactionTemplate transactionTemplate;

  @InjectMocks private AccountService accountService;

  private final UUID userId = UUID.randomUUID();
  private final UUID accountId = UUID.randomUUID();

  private User user() {
    return User.builder().id(userId).firstName("Jane").lastName("Doe").build();
  }

  private Account account(BigDecimal balance) {
    return Account.builder()
        .id(accountId)
        .user(user())
        .currency(Currency.EUR)
        .balance(balance)
        .build();
  }

  @BeforeEach
  void setupTransactionTemplate() {
    lenient()
        .doAnswer(
            inv -> {
              TransactionCallback<?> cb = inv.getArgument(0);
              return cb.doInTransaction(null);
            })
        .when(transactionTemplate)
        .execute(any());
  }

  @Nested
  class CreateAccountTests {

    @Test
    void success() {
      when(userRepository.findById(userId)).thenReturn(Optional.of(user()));
      when(accountRepository.save(any())).thenReturn(account(BigDecimal.ZERO));

      Account result = accountService.createAccount(userId, Currency.EUR);

      assertThat(result.getCurrency()).isEqualTo(Currency.EUR);
      verify(accountRepository).save(any());
    }

    @Test
    void throwsWhenUserNotFound() {
      when(userRepository.findById(userId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> accountService.createAccount(userId, Currency.EUR))
          .isInstanceOf(UserNotFoundException.class);
    }
  }

  @Nested
  class DepositTests {

    @Test
    void addsToBalance() {
      Account acc = account(new BigDecimal("100.00"));

      when(accountRepository.findByIdWithLock(accountId)).thenReturn(Optional.of(acc));
      when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

      Transaction tx = accountService.deposit(accountId, new BigDecimal("50.00"), "test", userId);

      assertThat(acc.getBalance()).isEqualByComparingTo("150.00");
      assertThat(tx.getType().name()).isEqualTo("DEPOSIT");

      verify(accountRepository).save(acc);
    }

    @Test
    void throwsWhenAccountNotFound() {
      when(accountRepository.findByIdWithLock(accountId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> accountService.deposit(accountId, BigDecimal.TEN, null, userId))
          .isInstanceOf(AccountNotFoundException.class);
    }

    @Test
    void throwsWhenNotOwner() {
      Account acc = account(BigDecimal.ZERO);
      when(accountRepository.findByIdWithLock(accountId)).thenReturn(Optional.of(acc));

      assertThatThrownBy(
              () -> accountService.deposit(accountId, BigDecimal.TEN, null, UUID.randomUUID()))
          .isInstanceOf(ForbiddenException.class);
    }
  }

  @Nested
  class WithdrawTests {

    @Test
    void subtractsFromBalance() {
      Account acc = account(new BigDecimal("200.00"));

      when(accountRepository.findById(accountId)).thenReturn(Optional.of(acc));
      when(accountRepository.findByIdWithLock(accountId)).thenReturn(Optional.of(acc));
      when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

      accountService.withdraw(accountId, new BigDecimal("50.00"), "rent", userId);

      assertThat(acc.getBalance()).isEqualByComparingTo("150.00");
      verify(externalAuditClient).notifyDebit(accountId, new BigDecimal("50.00"), "EUR");
    }

    @Test
    void throwsWhenInsufficientFunds() {
      Account acc = account(new BigDecimal("10.00"));

      when(accountRepository.findById(accountId)).thenReturn(Optional.of(acc));

      assertThatThrownBy(
              () -> accountService.withdraw(accountId, new BigDecimal("100.00"), null, userId))
          .isInstanceOf(InsufficientFundsException.class);

      verifyNoInteractions(externalAuditClient);
    }

    @Test
    void abortsWhenExternalServiceFails() {
      Account acc = account(new BigDecimal("200.00"));

      when(accountRepository.findById(accountId)).thenReturn(Optional.of(acc));
      doThrow(new ExternalServiceException("unavailable"))
          .when(externalAuditClient)
          .notifyDebit(any(), any(), any());

      assertThatThrownBy(
              () -> accountService.withdraw(accountId, new BigDecimal("50.00"), null, userId))
          .isInstanceOf(ExternalServiceException.class);

      verify(transactionTemplate, never()).execute(any());
      verify(accountRepository, never()).save(any());
    }
  }

  @Nested
  class ExchangeTests {

    @Test
    void success() {
      UUID sourceId = UUID.randomUUID();
      UUID targetId = UUID.randomUUID();

      Account source =
          Account.builder()
              .id(sourceId)
              .user(user())
              .currency(Currency.EUR)
              .balance(new BigDecimal("500.00"))
              .build();

      Account target =
          Account.builder()
              .id(targetId)
              .user(user())
              .currency(Currency.USD)
              .balance(new BigDecimal("100.00"))
              .build();

      when(accountRepository.findByIdWithLock(sourceId)).thenReturn(Optional.of(source));
      when(accountRepository.findByIdWithLock(targetId)).thenReturn(Optional.of(target));
      when(exchangeRateService.getRate(Currency.EUR, Currency.USD))
          .thenReturn(new BigDecimal("1.09"));
      when(exchangeRateService.convert(any(), eq(Currency.EUR), eq(Currency.USD)))
          .thenReturn(new BigDecimal("109.00"));
      when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

      ExchangeResult result =
          accountService.exchange(sourceId, targetId, new BigDecimal("100.00"), userId);

      assertThat(source.getBalance()).isEqualByComparingTo("400.00");
      assertThat(target.getBalance()).isEqualByComparingTo("209.00");
      assertThat(result.exchangeRate()).isEqualByComparingTo("1.09");
    }

    @Test
    void throwsWhenSameCurrency() {
      UUID sourceId = UUID.randomUUID();
      UUID targetId = UUID.randomUUID();

      Account source =
          Account.builder()
              .id(sourceId)
              .user(user())
              .currency(Currency.EUR)
              .balance(new BigDecimal("500"))
              .build();

      Account target =
          Account.builder()
              .id(targetId)
              .user(user())
              .currency(Currency.EUR)
              .balance(new BigDecimal("100"))
              .build();

      when(accountRepository.findByIdWithLock(sourceId)).thenReturn(Optional.of(source));
      when(accountRepository.findByIdWithLock(targetId)).thenReturn(Optional.of(target));

      assertThatThrownBy(() -> accountService.exchange(sourceId, targetId, BigDecimal.TEN, userId))
          .isInstanceOf(InvalidExchangeException.class);
    }

    @Test
    void throwsWhenInsufficientFunds() {
      UUID sourceId = UUID.randomUUID();
      UUID targetId = UUID.randomUUID();

      Account source =
          Account.builder()
              .id(sourceId)
              .user(user())
              .currency(Currency.EUR)
              .balance(new BigDecimal("5"))
              .build();

      Account target =
          Account.builder()
              .id(targetId)
              .user(user())
              .currency(Currency.USD)
              .balance(new BigDecimal("100"))
              .build();

      when(accountRepository.findByIdWithLock(sourceId)).thenReturn(Optional.of(source));
      when(accountRepository.findByIdWithLock(targetId)).thenReturn(Optional.of(target));

      assertThatThrownBy(
              () -> accountService.exchange(sourceId, targetId, new BigDecimal("100.00"), userId))
          .isInstanceOf(InsufficientFundsException.class);
    }
  }
}
