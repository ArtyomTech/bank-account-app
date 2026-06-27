package ee.swedbank.account_service.controller;

import ee.swedbank.account_service.api.AccountsApi;
import ee.swedbank.account_service.dto.*;
import ee.swedbank.account_service.entity.Currency;
import ee.swedbank.account_service.mapper.AccountMapper;
import ee.swedbank.account_service.mapper.TransactionMapper;
import ee.swedbank.account_service.service.AccountService;
import ee.swedbank.account_service.util.SecurityUtil;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AccountController implements AccountsApi {

  private final AccountService accountService;
  private final AccountMapper accountMapper;
  private final TransactionMapper transactionMapper;

  @Override
  public ResponseEntity<AccountResponse> createAccount(UUID userId, CreateAccountRequest request) {
    Currency currency = Currency.valueOf(request.getCurrency().name());
    var account = accountService.createAccount(SecurityUtil.currentUserId(), currency);
    return ResponseEntity.status(HttpStatus.CREATED).body(accountMapper.toResponse(account));
  }

  @Override
  public ResponseEntity<List<AccountResponse>> getUserAccounts(UUID userId) {
    return ResponseEntity.ok(
        accountMapper.toResponseList(
            accountService.getUserAccounts(userId, SecurityUtil.currentUserId())));
  }

  @Override
  public ResponseEntity<BalanceResponse> getBalance(UUID accountId) {
    return ResponseEntity.ok(
        accountMapper.toBalanceResponse(
            accountService.getAccount(accountId, SecurityUtil.currentUserId())));
  }

  @Override
  public ResponseEntity<TransactionResponse> deposit(UUID accountId, MoneyRequest request) {
    var tx =
        accountService.deposit(
            accountId, request.getAmount(), request.getDescription(), SecurityUtil.currentUserId());
    return ResponseEntity.ok(transactionMapper.toResponse(tx));
  }

  @Override
  public ResponseEntity<TransactionResponse> withdraw(UUID accountId, MoneyRequest request) {
    var tx =
        accountService.withdraw(
            accountId, request.getAmount(), request.getDescription(), SecurityUtil.currentUserId());
    return ResponseEntity.ok(transactionMapper.toResponse(tx));
  }

  @Override
  public ResponseEntity<ExchangeResponse> exchange(ExchangeRequest request) {
    var result =
        accountService.exchange(
            request.getSourceAccountId(),
            request.getTargetAccountId(),
            request.getAmount(),
            SecurityUtil.currentUserId());

    ExchangeResponse response = new ExchangeResponse();
    response.setSourceTransaction(transactionMapper.toResponse(result.sourceTransaction()));
    response.setTargetTransaction(transactionMapper.toResponse(result.targetTransaction()));
    response.setExchangeRate(result.exchangeRate());
    return ResponseEntity.ok(response);
  }
}
