package br.com.ricardofigueiredo.guarida.comum;

import br.com.ricardofigueiredo.guarida.comum.excecao.ConflitoException;
import br.com.ricardofigueiredo.guarida.comum.excecao.RecursoNaoEncontradoException;
import br.com.ricardofigueiredo.guarida.comum.excecao.RegraDeNegocioException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.lang.reflect.Method;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ManipuladorDeExcecoesTest {

    private final ManipuladorDeExcecoes manipulador = new ManipuladorDeExcecoes();

    @Test
    @DisplayName("erro de validacao vira 400 com o mapa de campos, incluindo os erros do objeto inteiro")
    void validacaoViraQuatrocentos() throws Exception {
        BindingResult resultado = new BeanPropertyBindingResult(new Object(), "animal");
        resultado.reject("semCampo", "faltou o corpo inteiro");
        resultado.addError(new FieldError("animal", "nome", "informe o nome"));

        ProblemDetail problema = manipulador.tratarValidacao(excecaoDeValidacao(resultado));

        assertThat(problema.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        @SuppressWarnings("unchecked")
        Map<String, String> campos = (Map<String, String>) problema.getProperties().get("campos");
        assertThat(campos).containsEntry("nome", "informe o nome");
        assertThat(campos).containsEntry("animal", "faltou o corpo inteiro");
    }

    @Test
    @DisplayName("parametro com tipo errado vira 400 dizendo qual foi")
    void tipoErradoViraQuatrocentos() throws Exception {
        Method metodo = ManipuladorDeExcecoesTest.class.getDeclaredMethod("alvo", String.class);
        var excecao = new MethodArgumentTypeMismatchException("bidu", Long.class, "id",
                new MethodParameter(metodo, 0), null);

        ProblemDetail problema = manipulador.tratarTipoErrado(excecao);

        assertThat(problema.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(problema.getDetail()).contains("id");
    }

    @Test
    @DisplayName("corpo ilegivel vira 400, e nao erro do servidor")
    void corpoIlegivelViraQuatrocentos() {
        ProblemDetail problema =
                manipulador.tratarCorpoIlegivel(new HttpMessageNotReadableException("quebrado", null, null));

        assertThat(problema.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(problema.getDetail()).contains("JSON");
    }

    @Test
    @DisplayName("recurso ausente vira 404 com a mensagem original")
    void naoEncontradoViraQuatrocentosEQuatro() {
        ProblemDetail problema =
                manipulador.tratarNaoEncontrado(new RecursoNaoEncontradoException("nao achei"));

        assertThat(problema.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(problema.getDetail()).isEqualTo("nao achei");
    }

    @Test
    @DisplayName("regra de negocio vira 422")
    void regraDeNegocioViraQuatrocentosEVinteEDois() {
        ProblemDetail problema =
                manipulador.tratarRegraDeNegocio(new RegraDeNegocioException("nao pode"));

        assertThat(problema.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY.value());
        assertThat(problema.getTitle()).isEqualTo("Operacao nao permitida");
    }

    @Test
    @DisplayName("conflito vira 409")
    void conflitoViraQuatrocentosENove() {
        ProblemDetail problema = manipulador.tratarConflito(new ConflitoException("ja existe"));

        assertThat(problema.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(problema.getDetail()).isEqualTo("ja existe");
    }

    @Test
    @DisplayName("credencial errada vira 401 sem repetir o que a pessoa digitou")
    void credenciaisViramQuatrocentosEUm() {
        ProblemDetail problema = manipulador.tratarCredenciais(new BadCredentialsException("senha ruim"));

        assertThat(problema.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(problema.getDetail()).isEqualTo("E-mail ou senha nao conferem.");
    }

    private MethodArgumentNotValidException excecaoDeValidacao(BindingResult resultado) throws Exception {
        Method metodo = ManipuladorDeExcecoesTest.class.getDeclaredMethod("alvo", String.class);
        return new MethodArgumentNotValidException(new MethodParameter(metodo, 0), resultado);
    }

    @SuppressWarnings("unused")
    private void alvo(String argumento) {
    }
}
