package com.library.fine;

import com.library.exception.BusinessException;
import com.library.infrastructure.IdempotencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

class FineNotFoundException extends BusinessException {
    public FineNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}

class FineException extends BusinessException {
    public FineException(String message, HttpStatus status) {
        super(message, status);
    }
}

@Service
@Transactional
@RequiredArgsConstructor
public class FineService {

    private final FineRepository fineRepository;
    private final IdempotencyService idempotencyService;

    @Transactional(readOnly = true)
    public List<Fine> getFinesByMember(Long memberId) {
        return fineRepository.findByMemberId(memberId);
    }

    public Fine payFine(Long fineId, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            if (idempotencyService.has(idempotencyKey)) {
                Object cached = idempotencyService.get(idempotencyKey);
                if (cached instanceof Fine) {
                    return (Fine) cached;
                }
            }
        }

        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new FineNotFoundException("Fine not found with ID: " + fineId));

        if (fine.getStatus() == FineStatus.PAID) {
            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                idempotencyService.save(idempotencyKey, fine);
            }
            return fine;
        }

        if (fine.getStatus() == FineStatus.WAIVED) {
            throw new FineException("Fine is already waived. Cannot pay.", HttpStatus.BAD_REQUEST);
        }

        fine.setStatus(FineStatus.PAID);
        fine = fineRepository.save(fine);

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            idempotencyService.save(idempotencyKey, fine);
        }

        return fine;
    }

    public Fine waiveFine(Long fineId, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            if (idempotencyService.has(idempotencyKey)) {
                Object cached = idempotencyService.get(idempotencyKey);
                if (cached instanceof Fine) {
                    return (Fine) cached;
                }
            }
        }

        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new FineNotFoundException("Fine not found with ID: " + fineId));

        if (fine.getStatus() == FineStatus.WAIVED) {
            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                idempotencyService.save(idempotencyKey, fine);
            }
            return fine;
        }

        if (fine.getStatus() == FineStatus.PAID) {
            throw new FineException("Fine is already paid. Cannot waive.", HttpStatus.BAD_REQUEST);
        }

        fine.setStatus(FineStatus.WAIVED);
        fine = fineRepository.save(fine);

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            idempotencyService.save(idempotencyKey, fine);
        }

        return fine;
    }
}
