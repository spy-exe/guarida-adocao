package br.com.ricardofigueiredo.guarida.candidatura;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CandidaturaFluxoIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("qualquer pessoa se candidata sem cadastro, e recebe um protocolo")
    void candidaturaPublica() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);

        mockMvc.perform(post("/api/v1/animais/" + animal + "/candidaturas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDaCandidatura("Maria Souza", "maria@exemplo.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("RECEBIDA"))
                .andExpect(jsonPath("$.animalNome").isNotEmpty())
                // o protocolo nao devolve de volta os dados pessoais enviados
                .andExpect(jsonPath("$.telefone").doesNotExist())
                .andExpect(jsonPath("$.mensagem").doesNotExist());
    }

    @Test
    @DisplayName("a fila de candidaturas só aparece para o abrigo dono")
    void filaExigeToken() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);
        candidatar(animal, "Maria Souza", "maria@exemplo.com");

        mockMvc.perform(get("/api/v1/candidaturas"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/candidaturas").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDeItens").value(1))
                .andExpect(jsonPath("$.itens[0].nome").value("Maria Souza"))
                .andExpect(jsonPath("$.itens[0].telefone").isNotEmpty());
    }

    @Test
    @DisplayName("aprovar reserva o animal e cancela as outras candidaturas em aberto")
    void aprovacaoCancelaAsOutras() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);

        long primeira = candidatar(animal, "Maria Souza", "maria@exemplo.com");
        long segunda = candidatar(animal, "João Lima", "joao@exemplo.com");

        mockMvc.perform(post("/api/v1/candidaturas/" + primeira + "/aprovacao")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APROVADA"));

        mockMvc.perform(get("/api/v1/animais/" + animal))
                .andExpect(jsonPath("$.status").value("EM_PROCESSO"));

        mockMvc.perform(get("/api/v1/animais/" + animal + "/candidaturas")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$[?(@.id == " + segunda + ")].status").value("CANCELADA"));
    }

    @Test
    @DisplayName("animal reservado não aceita candidatura nova")
    void reservadoNaoAceitaCandidatura() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);
        long primeira = candidatar(animal, "Maria Souza", "maria@exemplo.com");

        mockMvc.perform(post("/api/v1/candidaturas/" + primeira + "/aprovacao")
                .header(HttpHeaders.AUTHORIZATION, token));

        mockMvc.perform(post("/api/v1/animais/" + animal + "/candidaturas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDaCandidatura("Atrasado", "atrasado@exemplo.com")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail")
                        .value(org.hamcrest.Matchers.containsString("Em processo")));
    }

    @Test
    @DisplayName("o ciclo completo: análise, aprovacao, adoção concluída")
    void cicloCompleto() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);
        long candidatura = candidatar(animal, "Maria Souza", "maria@exemplo.com");

        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/analise")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.status").value("EM_ANALISE"));

        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/aprovacao")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.status").value("APROVADA"));

        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/adocao")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/animais/" + animal))
                .andExpect(jsonPath("$.status").value("ADOTADO"));

        mockMvc.perform(get("/api/v1/animais/" + animal + "/eventos"))
                .andExpect(jsonPath("$[?(@.tipo == 'ADOCAO')].descricao")
                        .value(org.hamcrest.Matchers.hasItem(
                                org.hamcrest.Matchers.containsString("Maria Souza"))));
    }

    @Test
    @DisplayName("animal adotado não pode ser excluído, mas pode ser devolvido")
    void adotadoNaoSeExcluiMasSeDevolve() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);
        long candidatura = candidatar(animal, "Maria Souza", "maria@exemplo.com");

        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/aprovacao")
                .header(HttpHeaders.AUTHORIZATION, token));
        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/adocao")
                .header(HttpHeaders.AUTHORIZATION, token));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/v1/animais/" + animal)
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail")
                        .value(org.hamcrest.Matchers.containsString("registre a devolução")));

        mockMvc.perform(post("/api/v1/animais/" + animal + "/devolucao")
                        .param("motivo", "A família mudou de pais")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISPONIVEL"));

        mockMvc.perform(get("/api/v1/animais/" + animal + "/eventos"))
                .andExpect(jsonPath("$[?(@.tipo == 'DEVOLUCAO')].descricao")
                        .value(org.hamcrest.Matchers.hasItem("A família mudou de pais")));
    }

    @Test
    @DisplayName("com vinte pedidos em aberto a fila fecha, e mensagem em branco nao e guardada")
    void filaCheiaEMensagemEmBranco() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);

        mockMvc.perform(post("/api/v1/animais/" + animal + "/candidaturas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDaCandidatura("Maria Souza", "maria@exemplo.com")
                                .replace("Trabalho de casa e tenho tempo de sobra", "   ")))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/animais/" + animal + "/candidaturas").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$[0].mensagem").doesNotExist());

        for (int pessoa = 1; pessoa < 20; pessoa++) {
            candidatar(animal, "Pessoa " + pessoa, "pessoa" + pessoa + "@exemplo.com");
        }

        mockMvc.perform(post("/api/v1/animais/" + animal + "/candidaturas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDaCandidatura("Vinte e um", "vinte.e.um@exemplo.com")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("está cheia")));
    }

    @Test
    @DisplayName("devolucao sem motivo escrito fica registrada com texto padrao")
    void devolucaoSemMotivo() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);
        long candidatura = candidatar(animal, "Maria Souza", "maria@exemplo.com");
        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/aprovacao").header(HttpHeaders.AUTHORIZATION, token));
        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/adocao").header(HttpHeaders.AUTHORIZATION, token));

        mockMvc.perform(post("/api/v1/animais/" + animal + "/devolucao")
                        .param("motivo", "  ")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/animais/" + animal + "/eventos"))
                .andExpect(jsonPath("$[?(@.tipo == 'DEVOLUCAO')].descricao")
                        .value(org.hamcrest.Matchers.hasItem("Devolvido ao abrigo")));
    }

    @Test
    @DisplayName("concluir adoção sem aprovacao não passa")
    void adocaoExigeAprovacao() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);
        long candidatura = candidatar(animal, "Maria Souza", "maria@exemplo.com");

        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/adocao")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("recusar exige motivo e guarda o que foi escrito")
    void recusaComMotivo() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);
        long candidatura = candidatar(animal, "Maria Souza", "maria@exemplo.com");

        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/recusa")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"motivo": ""}"""))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/recusa")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"motivo": "O apartamento não tem tela nas janelas"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECUSADA"))
                .andExpect(jsonPath("$.motivoDaRecusa").value("O apartamento não tem tela nas janelas"));
    }

    @Test
    @DisplayName("candidatura de outro abrigo não pode ser mexida")
    void isolamentoEntreAbrigos() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);
        long candidatura = candidatar(animal, "Maria Souza", "maria@exemplo.com");

        String tokenDeOutro = autenticar();

        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/aprovacao")
                        .header(HttpHeaders.AUTHORIZATION, tokenDeOutro))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("candidatura para animal que não existe devolve 404")
    void animalInexistente() throws Exception {
        mockMvc.perform(post("/api/v1/animais/999999/candidaturas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDaCandidatura("Maria", "maria@exemplo.com")))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("dados de contato invalidos não passam da validação")
    void validacaoDaCandidatura() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);

        mockMvc.perform(post("/api/v1/animais/" + animal + "/candidaturas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "M", "email": "nao-e-email", "telefone": "123",
                                 "cidade": "Niterói", "moradia": "CASA"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.email").isNotEmpty())
                .andExpect(jsonPath("$.campos.telefone").isNotEmpty())
                .andExpect(jsonPath("$.campos.areaProtegida").isNotEmpty());
    }

    @Test
    @DisplayName("a fila filtra por situação")
    void filtroDaFila() throws Exception {
        String token = autenticar();
        long animal = criarAnimal(token);
        long primeira = candidatar(animal, "Maria Souza", "maria@exemplo.com");
        candidatar(animal, "João Lima", "joao@exemplo.com");

        mockMvc.perform(post("/api/v1/candidaturas/" + primeira + "/analise")
                .header(HttpHeaders.AUTHORIZATION, token));

        mockMvc.perform(get("/api/v1/candidaturas").param("status", "EM_ANALISE")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.totalDeItens").value(1))
                .andExpect(jsonPath("$.itens[0].nome").value("Maria Souza"));

        mockMvc.perform(get("/api/v1/candidaturas").param("status", "RECEBIDA")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.totalDeItens").value(1))
                .andExpect(jsonPath("$.itens[0].nome").value("João Lima"));
    }

    private long candidatar(long animal, String nome, String email) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/v1/animais/" + animal + "/candidaturas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDaCandidatura(nome, email)))
                .andExpect(status().isCreated())
                .andReturn();

        return ler(resultado).get("id").asLong();
    }

    private String corpoDaCandidatura(String nome, String email) {
        return """
                {
                  "nome": "%s",
                  "email": "%s",
                  "telefone": "21999998888",
                  "cidade": "Niterói",
                  "moradia": "APARTAMENTO",
                  "areaProtegida": true,
                  "temOutrosAnimais": false,
                  "mensagem": "Trabalho de casa e tenho tempo de sobra"
                }""".formatted(nome, email);
    }

    private long criarAnimal(String token) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Bidu",
                                  "especie": "CACHORRO",
                                  "sexo": "MACHO",
                                  "porte": "MEDIO",
                                  "nascimentoEstimado": "%s",
                                  "pesoEmGramas": 15000,
                                  "dataDeEntrada": "%s"
                                }""".formatted(LocalDate.now().minusYears(2), LocalDate.now().minusMonths(3)))) 
                .andExpect(status().isCreated())
                .andReturn();

        return ler(resultado).get("id").asLong();
    }

    private String autenticar() throws Exception {
        String email = "abrigo-" + UUID.randomUUID() + "@exemplo.com";

        mockMvc.perform(post("/api/v1/autenticacao/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "Abrigo São Francisco", "email": "%s", "senha": "senhaforte123",
                                 "cidade": "Niterói"}""".formatted(email)))
                .andExpect(status().isCreated());

        MvcResult login = mockMvc.perform(post("/api/v1/autenticacao/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "senha": "senhaforte123"}""".formatted(email)))
                .andReturn();

        return "Bearer " + ler(login).get("token").asText();
    }

    private JsonNode ler(MvcResult resultado) throws Exception {
        return objectMapper.readTree(resultado.getResponse().getContentAsString());
    }
}
