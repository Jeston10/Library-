package com.library.catalog;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddCopyRequest {
    @NotBlank(message = "Barcode is required")
    private String barcode;
}
