package com.library.fine;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {

    @Query("SELECT COUNT(f) > 0 FROM Fine f WHERE f.member.id = :memberId AND f.status = 'OWED'")
    boolean hasOutstandingFines(@Param("memberId") Long memberId);

    List<Fine> findByMemberId(Long memberId);
}
