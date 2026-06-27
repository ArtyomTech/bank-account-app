package ee.swedbank.account_service.model;

import ee.swedbank.account_service.entity.Transaction;
import java.math.BigDecimal;

public record ExchangeResult(
    Transaction sourceTransaction, Transaction targetTransaction, BigDecimal exchangeRate) {}
