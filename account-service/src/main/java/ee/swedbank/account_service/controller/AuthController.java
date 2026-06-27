package ee.swedbank.account_service.controller;

import ee.swedbank.account_service.api.AuthApi;
import ee.swedbank.account_service.dto.AuthResponse;
import ee.swedbank.account_service.dto.LoginRequest;
import ee.swedbank.account_service.dto.RegisterRequest;
import ee.swedbank.account_service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AuthController implements AuthApi {

  private final AuthService authService;

  @Override
  public ResponseEntity<AuthResponse> register(RegisterRequest request) {
    var response =
        authService.register(
            request.getFirstName(),
            request.getLastName(),
            request.getEmail(),
            request.getPassword());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @Override
  public ResponseEntity<AuthResponse> login(LoginRequest request) {
    return ResponseEntity.ok(authService.login(request.getEmail(), request.getPassword()));
  }
}
