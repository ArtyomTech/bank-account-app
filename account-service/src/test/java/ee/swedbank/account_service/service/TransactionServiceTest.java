package ee.swedbank.account_service.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import ee.swedbank.account_service.entity.Account;
import ee.swedbank.account_service.entity.Currency;
import ee.swedbank.account_service.entity.Transaction;
import ee.swedbank.account_service.entity.User;
import ee.swedbank.account_service.exception.AccountNotFoundException;
import ee.swedbank.account_service.exception.ForbiddenException;
import ee.swedbank.account_service.repository.AccountRepository;
import ee.swedbank.account_service.repository.TransactionRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

  @Mock private AccountRepository accountRepository;
  @Mock private TransactionRepository transactionRepository;

  @InjectMocks private TransactionService transactionService;

  private final UUID userId = UUID.randomUUID();
  private final UUID accountId = UUID.randomUUID();

  private Account account() {
    User owner = User.builder().id(userId).build();
    return Account.builder().id(accountId).user(owner).currency(Currency.EUR).build();
  }

  @Test
  void getTransactionHistory_returnsPage() {
    when(accountRepository.findById(accountId)).thenReturn(Optional.of(account()));
    var page = new PageImpl<Transaction>(List.of());
    when(transactionRepository.findByAccountIdOrderByCreatedAtDesc(any(), any())).thenReturn(page);

    var result = transactionService.getTransactionHistory(accountId, 0, 10, userId);

    assertThat(result).isNotNull();
    assertThat(result.getContent()).isEmpty();
  }

  @Test
  void getTransactionHistory_respectsPagination() {
    when(accountRepository.findById(accountId)).thenReturn(Optional.of(account()));
    var page = new PageImpl<Transaction>(List.of(), PageRequest.of(2, 5), 30);
    when(transactionRepository.findByAccountIdOrderByCreatedAtDesc(accountId, PageRequest.of(2, 5)))
        .thenReturn(page);

    var result = transactionService.getTransactionHistory(accountId, 2, 5, userId);

    assertThat(result.getTotalElements()).isEqualTo(30);
    assertThat(result.getNumber()).isEqualTo(2);
  }

  @Test
  void getTransactionHistory_throwsWhenAccountNotFound() {
    when(accountRepository.findById(accountId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> transactionService.getTransactionHistory(accountId, 0, 10, userId))
        .isInstanceOf(AccountNotFoundException.class);
  }

  @Test
  void getTransactionHistory_throwsWhenNotOwner() {
    when(accountRepository.findById(accountId)).thenReturn(Optional.of(account()));

    assertThatThrownBy(
            () -> transactionService.getTransactionHistory(accountId, 0, 10, UUID.randomUUID()))
        .isInstanceOf(ForbiddenException.class);
  }
}
