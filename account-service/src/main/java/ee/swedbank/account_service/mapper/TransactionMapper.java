package ee.swedbank.account_service.mapper;

import ee.swedbank.account_service.dto.TransactionResponse;
import ee.swedbank.account_service.entity.Transaction;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = DateTimeMapper.class)
public interface TransactionMapper {

  @Mapping(target = "accountId", source = "account.id")
  TransactionResponse toResponse(Transaction transaction);

  List<TransactionResponse> toResponseList(List<Transaction> transactions);
}
