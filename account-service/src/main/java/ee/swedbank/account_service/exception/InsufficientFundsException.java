package ee.swedbank.account_service.exception;

import java.math.BigDecimal;
import java.util.UUID;

public class InsufficientFundsException extends RuntimeException {
  public InsufficientFundsException(UUID accountId, BigDecimal available, BigDecimal required) {
    super(
        "Insufficient funds in account %s: available %s, required %s"
            .formatted(accountId, available.toPlainString(), required.toPlainString()));
  }
}
