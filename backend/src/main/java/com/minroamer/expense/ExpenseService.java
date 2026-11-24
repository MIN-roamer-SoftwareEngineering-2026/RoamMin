package com.minroamer.expense;

import com.fasterxml.jackson.databind.JsonNode;
import com.minroamer.common.ApiException;
import com.minroamer.trip.Trip;
import com.minroamer.trip.TripMemberRepository;
import com.minroamer.trip.TripRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseService {
    private final ExpenseRepository expenses;
    private final TripRepository trips;
    private final TripMemberRepository members;

    public ExpenseService(ExpenseRepository expenses, TripRepository trips, TripMemberRepository members) {
        this.expenses = expenses;
        this.trips = trips;
        this.members = members;
    }

    @Transactional
    public ExpenseResponse create(Long userId, Long tripId, ExpenseRequest request) {
        Trip trip = requireAccessibleTrip(userId, tripId);
        Expense expense = new Expense(trip, request.title().trim(), validateAmount(request.amountCents()),
            request.category(), request.date(), request.note() == null ? null : request.note().trim());
        return expenses.save(expense).toResponse();
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> list(Long userId, Long tripId) {
        requireAccessibleTrip(userId, tripId);
        return expenses.findAllByTrip_IdOrderByDateDescIdDesc(tripId)
            .stream().map(Expense::toResponse).toList();
    }

    private Trip requireAccessibleTrip(Long userId, Long tripId) {
        Trip trip = trips.findById(tripId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found"));
        if (!trip.getOwnerId().equals(userId) && !members.existsByTripIdAndUserId(tripId, userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Trip not found");
        }
        return trip;
    }

    private int validateAmount(JsonNode amount) {
        if (amount == null || !amount.isIntegralNumber()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "amount_cents must be an integer");
        }
        if (!amount.canConvertToInt() || amount.intValue() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "amount_cents must be between 1 and 2147483647");
        }
        return amount.intValue();
    }
}
