package com.library.loan;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequest {

    @NotNull(message = "Member ID is required")
    private Long memberId;

    @NotNull(message = "Book copy ID is required")
    private Long bookCopyId;
}
