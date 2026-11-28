package com.minroamer.expense;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findAllByTrip_IdOrderByDateDescIdDesc(Long tripId);
}
