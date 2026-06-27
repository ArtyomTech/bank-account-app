package ee.swedbank.account_service.mapper;

import ee.swedbank.account_service.dto.AccountResponse;
import ee.swedbank.account_service.dto.BalanceResponse;
import ee.swedbank.account_service.entity.Account;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = DateTimeMapper.class)
public interface AccountMapper {

  @Mapping(target = "userId", source = "user.id")
  AccountResponse toResponse(Account account);

  List<AccountResponse> toResponseList(List<Account> accounts);

  @Mapping(target = "accountId", source = "id")
  BalanceResponse toBalanceResponse(Account account);
}
