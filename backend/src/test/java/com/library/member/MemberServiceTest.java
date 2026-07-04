package com.library.member;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MemberServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private MemberService memberService;

    private Member sampleMember;

    @BeforeEach
    public void setup() {
        sampleMember = Member.builder()
                .id(1L)
                .name("John Doe")
                .email("john.doe@library.com")
                .tier(MemberTier.REGULAR)
                .status(MemberStatus.ACTIVE)
                .build();
    }

    @Test
    public void testRegisterMember_Success() {
        when(memberRepository.findByEmail(sampleMember.getEmail())).thenReturn(Optional.empty());
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Member registered = memberService.registerMember(sampleMember);
        assertNotNull(registered);
        assertEquals(MemberStatus.ACTIVE, registered.getStatus());
        verify(memberRepository, times(1)).save(any(Member.class));
    }

    @Test
    public void testRegisterMember_EmailExists() {
        when(memberRepository.findByEmail(sampleMember.getEmail())).thenReturn(Optional.of(sampleMember));

        assertThrows(MemberEmailAlreadyExistsException.class, () -> {
            memberService.registerMember(sampleMember);
        });
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    public void testUpdateStatus() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(sampleMember));
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Member updated = memberService.updateMemberStatus(1L, MemberStatus.SUSPENDED);
        assertNotNull(updated);
        assertEquals(MemberStatus.SUSPENDED, updated.getStatus());
    }

    @Test
    public void testUpdateTier() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(sampleMember));
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Member updated = memberService.updateMemberTier(1L, MemberTier.SUPPORTING);
        assertNotNull(updated);
        assertEquals(MemberTier.SUPPORTING, updated.getTier());
    }
}
