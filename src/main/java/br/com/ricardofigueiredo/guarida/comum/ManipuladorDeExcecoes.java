package br.com.ricardofigueiredo.guarida.comum;

import br.com.ricardofigueiredo.guarida.comum.excecao.ConflitoException;
import br.com.ricardofigueiredo.guarida.comum.excecao.RecursoNaoEncontradoException;
import br.com.ricardofigueiredo.guarida.comum.excecao.RegraDeNegocioException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Concentra a traducao de excecao para resposta HTTP no formato RFC 7807.
 * Nenhum controller monta corpo de erro na mao, e por isso todo erro da API
 * sai com a mesma cara.
 */
@RestControllerAdvice
public class ManipuladorDeExcecoes {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail tratarValidacao(MethodArgumentNotValidException excecao) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError erro : excecao.getBindingResult().getFieldErrors()) {
            campos.putIfAbsent(erro.getField(), erro.getDefaultMessage());
        }
        excecao.getBindingResult().getGlobalErrors()
                .forEach(erro -> campos.putIfAbsent(erro.getObjectName(), erro.getDefaultMessage()));

        ProblemDetail problema = montar(HttpStatus.BAD_REQUEST, "Requisição inválida",
                "Um ou mais campos não passaram na validação.");
        problema.setProperty("campos", campos);
        return problema;
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail tratarTipoErrado(MethodArgumentTypeMismatchException excecao) {
        return montar(HttpStatus.BAD_REQUEST, "Requisição inválida",
                "O valor informado em " + excecao.getName() + " não serve para esse campo.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail tratarCorpoIlegivel(HttpMessageNotReadableException excecao) {
        return montar(HttpStatus.BAD_REQUEST, "Requisição inválida",
                "O corpo da requisição não pode ser lido. Confira se e um JSON valido.");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail tratarArquivoGrande(MaxUploadSizeExceededException excecao) {
        return montar(HttpStatus.PAYLOAD_TOO_LARGE, "Arquivo grande demais",
                "A foto pode ter no máximo 2 MB.");
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ProblemDetail tratarArquivoAusente(MissingServletRequestPartException excecao) {
        return montar(HttpStatus.BAD_REQUEST, "Requisição inválida",
                "Envie o arquivo no campo " + excecao.getRequestPartName() + ".");
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ProblemDetail tratarNaoEncontrado(RecursoNaoEncontradoException excecao) {
        return montar(HttpStatus.NOT_FOUND, "Recurso não encontrado", excecao.getMessage());
    }

    @ExceptionHandler(RegraDeNegocioException.class)
    public ProblemDetail tratarRegraDeNegocio(RegraDeNegocioException excecao) {
        return montar(HttpStatus.UNPROCESSABLE_ENTITY, "Operação não permitida", excecao.getMessage());
    }

    @ExceptionHandler(ConflitoException.class)
    public ProblemDetail tratarConflito(ConflitoException excecao) {
        return montar(HttpStatus.CONFLICT, "Conflito", excecao.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail tratarCredenciais(BadCredentialsException excecao) {
        return montar(HttpStatus.UNAUTHORIZED, "Credenciais invalidas", "E-mail ou senha não conferem.");
    }

    private ProblemDetail montar(HttpStatus status, String titulo, String detalhe) {
        ProblemDetail problema = ProblemDetail.forStatus(status);
        problema.setTitle(titulo);
        problema.setDetail(detalhe);
        return problema;
    }
}
