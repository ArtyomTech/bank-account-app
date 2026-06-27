package ee.swedbank.account_service.exception;

import ee.swedbank.account_service.dto.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(AccountNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleAccountNotFound(AccountNotFoundException ex) {
    return error(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", ex.getMessage());
  }

  @ExceptionHandler(UserNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
    return error(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", ex.getMessage());
  }

  @ExceptionHandler(InsufficientFundsException.class)
  public ResponseEntity<ErrorResponse> handleInsufficientFunds(InsufficientFundsException ex) {
    return error(HttpStatus.UNPROCESSABLE_CONTENT, "INSUFFICIENT_FUNDS", ex.getMessage());
  }

  @ExceptionHandler(InvalidExchangeException.class)
  public ResponseEntity<ErrorResponse> handleInvalidExchange(InvalidExchangeException ex) {
    return error(HttpStatus.BAD_REQUEST, "INVALID_EXCHANGE", ex.getMessage());
  }

  @ExceptionHandler(DuplicateEmailException.class)
  public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException ex) {
    return error(HttpStatus.CONFLICT, "DUPLICATE_EMAIL", ex.getMessage());
  }

  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
    return error(HttpStatus.FORBIDDEN, "FORBIDDEN", ex.getMessage());
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
    return error(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
    String message =
        ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .collect(Collectors.joining(", "));
    return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
    return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getMessage());
  }

  @ExceptionHandler(ExternalServiceException.class)
  public ResponseEntity<ErrorResponse> handleExternalService(ExternalServiceException ex) {
    return error(HttpStatus.BAD_GATEWAY, "EXTERNAL_SERVICE_UNAVAILABLE", ex.getMessage());
  }

  private ResponseEntity<ErrorResponse> error(HttpStatus status, String code, String message) {
    ErrorResponse body = new ErrorResponse();
    body.setCode(code);
    body.setMessage(message);
    body.setTimestamp(OffsetDateTime.now());
    return ResponseEntity.status(status).body(body);
  }
}
