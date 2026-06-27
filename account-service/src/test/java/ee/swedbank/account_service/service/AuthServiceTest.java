package ee.swedbank.account_service.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ee.swedbank.account_service.dto.AuthResponse;
import ee.swedbank.account_service.entity.User;
import ee.swedbank.account_service.exception.DuplicateEmailException;
import ee.swedbank.account_service.repository.UserRepository;
import ee.swedbank.account_service.security.JwtService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private JwtService jwtService;
  @Mock private AuthenticationManager authenticationManager;

  @InjectMocks private AuthService authService;

  private static final UUID USER_ID = UUID.randomUUID();
  private static final String EMAIL = "jane@example.com";
  private static final String PASSWORD = "secret";
  private static final String TOKEN = "jwt-token";

  private User savedUser() {
    return User.builder()
        .id(USER_ID)
        .firstName("Jane")
        .lastName("Doe")
        .email(EMAIL)
        .passwordHash("hashed")
        .build();
  }

  @Nested
  class RegisterTests {

    @Test
    void createsUserAndReturnsToken() {
      when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
      when(passwordEncoder.encode(PASSWORD)).thenReturn("hashed");
      when(userRepository.save(any())).thenReturn(savedUser());
      when(jwtService.generateToken(USER_ID)).thenReturn(TOKEN);

      AuthResponse response = authService.register("Jane", "Doe", EMAIL, PASSWORD);

      assertThat(response.getToken()).isEqualTo(TOKEN);
      assertThat(response.getUserId()).isEqualTo(USER_ID);
      assertThat(response.getEmail()).isEqualTo(EMAIL);
      verify(userRepository).save(any());
    }

    @Test
    void throwsWhenEmailAlreadyExists() {
      when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

      assertThatThrownBy(() -> authService.register("Jane", "Doe", EMAIL, PASSWORD))
          .isInstanceOf(DuplicateEmailException.class);
    }
  }

  @Nested
  class LoginTests {

    @Test
    void returnsTokenOnSuccess() {
      when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(savedUser()));
      when(jwtService.generateToken(USER_ID)).thenReturn(TOKEN);

      AuthResponse response = authService.login(EMAIL, PASSWORD);

      assertThat(response.getToken()).isEqualTo(TOKEN);
      assertThat(response.getUserId()).isEqualTo(USER_ID);
      verify(authenticationManager).authenticate(any());
    }

    @Test
    void throwsOnBadCredentials() {
      when(authenticationManager.authenticate(any()))
          .thenThrow(new BadCredentialsException("bad credentials"));

      assertThatThrownBy(() -> authService.login(EMAIL, "wrong"))
          .isInstanceOf(BadCredentialsException.class);
    }
  }
}
