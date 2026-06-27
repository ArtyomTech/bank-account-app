package ee.swedbank.account_service.service;

import static org.assertj.core.api.Assertions.assertThat;

import ee.swedbank.account_service.entity.Currency;
import java.math.BigDecimal;
import org.assertj.core.data.Offset;
import org.junit.jupiter.api.Test;

class ExchangeRateServiceTest {

  private final ExchangeRateService service = new ExchangeRateService();

  @Test
  void convert_returnsSameAmount_whenSameCurrency() {
    BigDecimal amount = new BigDecimal("100.00");
    assertThat(service.convert(amount, Currency.EUR, Currency.EUR)).isEqualByComparingTo(amount);
  }

  @Test
  void convert_eurToUsd_returnsCorrectAmount() {
    // 100 EUR * 1.09 USD/EUR = 109.0000 USD
    BigDecimal result = service.convert(new BigDecimal("100"), Currency.EUR, Currency.USD);
    assertThat(result).isEqualByComparingTo("109.0000");
  }

  @Test
  void convert_usdToEur_returnsCorrectAmount() {
    // 109 USD / 1.09 = 100.0000 EUR
    BigDecimal result = service.convert(new BigDecimal("109"), Currency.USD, Currency.EUR);
    assertThat(result).isEqualByComparingTo("100.0000");
  }

  @Test
  void getRate_eurToGbp() {
    // 1 EUR / 1 * 0.86 = 0.86 GBP
    BigDecimal rate = service.getRate(Currency.EUR, Currency.GBP);
    assertThat(rate).isEqualByComparingTo("0.86");
  }

  @Test
  void getRate_isInverseOfOppositeRate() {
    BigDecimal eurToUsd = service.getRate(Currency.EUR, Currency.USD);
    BigDecimal usdToEur = service.getRate(Currency.USD, Currency.EUR);
    // Due to fixed-rate rounding at 4dp, round-trip is within 0.01% of 1
    assertThat(eurToUsd.multiply(usdToEur))
        .isCloseTo(BigDecimal.ONE, Offset.offset(new BigDecimal("0.001")));
  }
}
