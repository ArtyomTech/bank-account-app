package ee.swedbank.account_service.service;

import ee.swedbank.account_service.dto.AuthResponse;
import ee.swedbank.account_service.entity.User;
import ee.swedbank.account_service.exception.DuplicateEmailException;
import ee.swedbank.account_service.repository.UserRepository;
import ee.swedbank.account_service.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final AuthenticationManager authenticationManager;

  @Transactional
  public AuthResponse register(String firstName, String lastName, String email, String password) {
    log.info("Registering new user: email={}", email);
    if (userRepository.existsByEmail(email)) {
      log.warn("Registration failed: email already in use: {}", email);
      throw new DuplicateEmailException(email);
    }

    User user =
        userRepository.save(
            User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .build());
    log.info("User registered successfully: id={} email={}", user.getId(), email);
    return buildResponse(user);
  }

  public AuthResponse login(String email, String password) {
    log.info("Login attempt for email={}", email);
    authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found after authentication"));
    log.info("Login successful for user id={} email={}", user.getId(), email);
    return buildResponse(user);
  }

  private AuthResponse buildResponse(User user) {
    AuthResponse response = new AuthResponse();
    response.setToken(jwtService.generateToken(user.getId()));
    response.setUserId(user.getId());
    response.setFirstName(user.getFirstName());
    response.setLastName(user.getLastName());
    response.setEmail(user.getEmail());
    return response;
  }
}
