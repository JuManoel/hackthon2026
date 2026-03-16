package edu.ucaldas.hackathon.infra.erros;

import java.io.IOException;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import edu.ucaldas.hackathon.DTOs.ErrorDTO;
import edu.ucaldas.hackathon.infra.exception.DataNotFound;
import edu.ucaldas.hackathon.infra.exception.EntityAlredyExists;
import edu.ucaldas.hackathon.infra.exception.ErrorToken;
import edu.ucaldas.hackathon.infra.exception.MissingData;
import edu.ucaldas.hackathon.infra.exception.MissingToken;
import edu.ucaldas.hackathon.infra.exception.SaveFileError;
import jakarta.persistence.EntityNotFoundException;

@RestControllerAdvice
public class ErrorHandle {
    /**
     * Handles exceptions of type {@link EntityNotFoundException} and {@link DataNotFound}
     * by returning a 404 Not Found HTTP response with an error message.
     *
     * @param e the exception thrown when the requested entity or data is not found
     * @return a {@link ResponseEntity} containing an {@link ErrorDTO} with the error message and a "404" code
     */
    @ExceptionHandler({ EntityNotFoundException.class, DataNotFound.class })
    public ResponseEntity<ErrorDTO> handleEntityNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorDTO(e.getMessage(), "404"));
    }

    /**
     * Handles exceptions related to authentication tokens, such as {@link ErrorToken} and {@link MissingToken}.
     * Returns a 401 Unauthorized response with an error message encapsulated in an {@link ErrorDTO}.
     *
     * @param e the {@link ErrorToken} exception thrown when there is an issue with the authentication token
     * @return a {@link ResponseEntity} containing the error details and a 401 Unauthorized status
     */
    @ExceptionHandler({ ErrorToken.class, MissingToken.class })
    public ResponseEntity<ErrorDTO> handleErrorToken(ErrorToken e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorDTO(e.getMessage(), "401"));
    }

    /**
     * Handles exceptions related to missing data, entity already exists, or illegal arguments.
     * <p>
     * This method is invoked when a {@link MissingData}, {@link EntityAlredyExists}, or
     * {@link IllegalArgumentException} is thrown within the application. It returns a
     * {@link ResponseEntity} containing an {@link ErrorDTO} with the error message and a
     * 400 Bad Request status code.
     *
     * @param e the exception representing missing data
     * @return a ResponseEntity with error details and HTTP 400 status
     */
    @ExceptionHandler({ MissingData.class, EntityAlredyExists.class, IllegalArgumentException.class })
    public ResponseEntity<ErrorDTO> handleMissingData(MissingData e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorDTO(e.getMessage(), "400"));
    }

    /**
     * Handles exceptions related to file saving operations, specifically {@link SaveFileError} and {@link IOException}.
     * Returns a response entity with HTTP status 500 (Internal Server Error) and an error message encapsulated in an {@link ErrorDTO}.
     *
     * @param e the exception thrown during the file save operation
     * @return a {@link ResponseEntity} containing the error details and HTTP status 500
     */
    @ExceptionHandler({ SaveFileError.class, IOException.class })
    public ResponseEntity<ErrorDTO> handleSaveFileError(SaveFileError e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorDTO(e.getMessage(), "500"));
    }

    /**
     * Handles validation errors from {@link MethodArgumentNotValidException}.
     * Returns a response entity with HTTP status 400 (Bad Request) and validation error messages.
     *
     * @param e the exception thrown when request body validation fails
     * @return a {@link ResponseEntity} containing the validation error details and HTTP status 400
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDTO> handleValidationErrors(MethodArgumentNotValidException e) {
        String errorMessage = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorDTO(errorMessage, "400"));
    }

}