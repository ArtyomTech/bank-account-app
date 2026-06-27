package ee.swedbank.account_service.mapper;

import ee.swedbank.account_service.dto.UserResponse;
import ee.swedbank.account_service.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = DateTimeMapper.class)
public interface UserMapper {

  UserResponse toResponse(User user);
}
