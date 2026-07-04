package com.library.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.security.Principal;

@Getter
@AllArgsConstructor
public class CustomUserPrincipal implements Principal, Serializable {
    private final Long id;
    private final String email;
    private final String role;

    @Override
    public String getName() {
        return email;
    }
}
