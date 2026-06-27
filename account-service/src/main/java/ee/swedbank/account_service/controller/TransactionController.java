package ee.swedbank.account_service.controller;

import ee.swedbank.account_service.api.TransactionsApi;
import ee.swedbank.account_service.dto.TransactionPage;
import ee.swedbank.account_service.mapper.TransactionMapper;
import ee.swedbank.account_service.service.TransactionService;
import ee.swedbank.account_service.util.SecurityUtil;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TransactionController implements TransactionsApi {

  private final TransactionService transactionService;
  private final TransactionMapper transactionMapper;

  @Override
  public ResponseEntity<TransactionPage> getTransactionHistory(
      UUID accountId, Integer page, Integer size) {
    var txPage =
        transactionService.getTransactionHistory(
            accountId, page, size, SecurityUtil.currentUserId());

    TransactionPage response = new TransactionPage();
    response.setContent(transactionMapper.toResponseList(txPage.getContent()));
    response.setTotalElements(txPage.getTotalElements());
    response.setTotalPages(txPage.getTotalPages());
    response.setPage(txPage.getNumber());
    return ResponseEntity.ok(response);
  }
}
