package ee.swedbank.account_service.mapper;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DateTimeMapper {

  default OffsetDateTime toOffsetDateTime(LocalDateTime ldt) {
    return ldt == null ? null : ldt.atOffset(ZoneOffset.UTC);
  }
}
