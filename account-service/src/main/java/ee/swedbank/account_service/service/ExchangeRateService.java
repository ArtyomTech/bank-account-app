package ee.swedbank.account_service.service;

import ee.swedbank.account_service.entity.Currency;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ExchangeRateService {

  // Units of each currency per 1 EUR (fixed rates)
  private static final Map<Currency, BigDecimal> EUR_RATES =
      Map.of(
          Currency.EUR, BigDecimal.ONE,
          Currency.USD, new BigDecimal("1.09"),
          Currency.SEK, new BigDecimal("11.45"),
          Currency.GBP, new BigDecimal("0.86"),
          Currency.VND, new BigDecimal("27000"));

  /**
   * Convert {@code amount} from {@code from} currency to {@code to} currency. Conversion is done
   * via EUR as the base: amount / rateFrom * rateTo.
   */
  public BigDecimal convert(BigDecimal amount, Currency from, Currency to) {
    if (from == to) return amount;
    BigDecimal fromRate = EUR_RATES.get(from);
    BigDecimal toRate = EUR_RATES.get(to);
    BigDecimal result =
        amount
            .divide(fromRate, 10, RoundingMode.HALF_UP)
            .multiply(toRate)
            .setScale(4, RoundingMode.HALF_UP);
    log.debug(
        "Currency conversion: {} {} → {} {} (fromRate={} toRate={})",
        amount,
        from,
        result,
        to,
        fromRate,
        toRate);
    return result;
  }

  /** Returns the exchange rate for 1 unit of {@code from} in {@code to}. */
  public BigDecimal getRate(Currency from, Currency to) {
    BigDecimal rate = convert(BigDecimal.ONE, from, to).stripTrailingZeros();
    log.debug("Exchange rate {}/{} = {}", from, to, rate);
    return rate;
  }
}
