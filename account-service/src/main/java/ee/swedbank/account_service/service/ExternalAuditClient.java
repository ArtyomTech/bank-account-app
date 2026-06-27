package ee.swedbank.account_service.service;

import ee.swedbank.account_service.exception.ExternalServiceException;
import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * HTTP client for the external audit/logging system. Simulates a compliance pre-debit notification
 * using https://jsonplaceholder.typicode.com/posts as a stand-in endpoint.
 */
@Slf4j
@Service
public class ExternalAuditClient {

  private static final String AUDIT_URL = "https://jsonplaceholder.typicode.com/posts";

  private final RestClient restClient;

  public ExternalAuditClient() {
    HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
    factory.setReadTimeout(Duration.ofSeconds(5));

    this.restClient = RestClient.builder().requestFactory(factory).baseUrl(AUDIT_URL).build();
  }

  /**
   * Notifies the external audit system of a pending debit. Must be called <em>before</em> any
   * database transaction is opened.
   *
   * @throws ExternalServiceException if the remote call fails
   */
  public void notifyDebit(UUID accountId, BigDecimal amount, String currency) {
    Map<String, Object> payload =
        Map.of(
            "event",
            "DEBIT_INITIATED",
            "accountId",
            accountId.toString(),
            "amount",
            amount.toPlainString(),
            "currency",
            currency);

    log.info(
        "Notifying external audit service: DEBIT_INITIATED accountId={} amount={} {}",
        accountId,
        amount,
        currency);

    try {
      var status =
          restClient
              .post()
              .contentType(MediaType.APPLICATION_JSON)
              .body(payload)
              .retrieve()
              .toBodilessEntity()
              .getStatusCode();

      log.info("External audit service acknowledged debit: status={}", status);
    } catch (RestClientException e) {
      log.error(
          "External audit service unreachable for accountId={}: {}", accountId, e.getMessage());
      throw new ExternalServiceException(
          "External audit service is currently unavailable; debit aborted");
    }
  }
}
