package edu.ucaldas.hackathon.infra.errors;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import edu.ucaldas.hackathon.DTOs.ErrorDTO;
import edu.ucaldas.hackathon.DTOs.FieldErrorDTO;
import edu.ucaldas.hackathon.infra.exception.DataNotFound;
import edu.ucaldas.hackathon.infra.exception.EntityAlreadyExists;
import edu.ucaldas.hackathon.infra.exception.ErrorToken;
import edu.ucaldas.hackathon.infra.exception.MissingData;
import edu.ucaldas.hackathon.infra.exception.MissingToken;
import edu.ucaldas.hackathon.infra.exception.NotPermitted;
import jakarta.persistence.EntityNotFoundException;

@RestControllerAdvice
public class ErrorHandle {

    @ExceptionHandler({ EntityNotFoundException.class, DataNotFound.class })
    public ResponseEntity<ErrorDTO> handleEntityNotFound(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorDTO(e.getMessage(), "404"));
    }

    @ExceptionHandler({ ErrorToken.class, MissingToken.class })
    public ResponseEntity<ErrorDTO> handleErrorToken(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorDTO(e.getMessage(), "401"));
    }

    @ExceptionHandler(NotPermitted.class)
    public ResponseEntity<ErrorDTO> handleNotPermitted(NotPermitted e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorDTO(e.getMessage(), "403"));
    }

    @ExceptionHandler({ MissingData.class, EntityAlreadyExists.class, IllegalArgumentException.class })
    public ResponseEntity<ErrorDTO> handleBadRequest(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorDTO(e.getMessage(), "400"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<List<FieldErrorDTO>> handleValidationErrors(MethodArgumentNotValidException e) {
        List<FieldErrorDTO> errors = e.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldErrorDTO(error.getField(), error.getDefaultMessage()))
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }
}
