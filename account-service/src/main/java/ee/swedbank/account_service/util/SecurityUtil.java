package ee.swedbank.account_service.util;

import java.util.Objects;
import java.util.UUID;
import lombok.experimental.UtilityClass;
import org.springframework.security.core.context.SecurityContextHolder;

@UtilityClass
public class SecurityUtil {

  public UUID currentUserId() {
    return (UUID)
        Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication())
            .getPrincipal();
  }
}
