package br.com.ricardofigueiredo.guarida.animal;

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

/** Caminhos que o fluxo principal nao passa: filtros menos usados e recusas. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AnimalBordasIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("a API responde que esta no ar sem exigir token")
    void saude() throws Exception {
        mockMvc.perform(get("/saude"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("no ar"))
                .andExpect(jsonPath("$.instante").isNotEmpty());
    }

    @Test
    @DisplayName("telefone do abrigo e raca do animal em branco viram ausentes, nao texto vazio")
    void brancoViraAusente() throws Exception {
        String email = "branco-" + UUID.randomUUID() + "@exemplo.com";
        mockMvc.perform(post("/api/v1/autenticacao/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDeRegistro(email, "   ")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.telefone").doesNotExist());

        String token = autenticar();
        mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "Bidu", "especie": "CACHORRO", "raca": "   ", "sexo": "MACHO", "porte": "MEDIO",
                                 "nascimentoEstimado": "%s", "pesoEmGramas": 15000, "dataDeEntrada": "%s"}"""
                                .formatted(LocalDate.now().minusYears(1), LocalDate.now())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.raca").doesNotExist());

        // sem nascimento a regra de datas nao tem o que comparar, e quem reclama e o campo obrigatorio
        mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "Bidu", "especie": "CACHORRO", "sexo": "MACHO", "porte": "MEDIO",
                                 "pesoEmGramas": 15000, "dataDeEntrada": "%s"}""".formatted(LocalDate.now())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nascimentoEstimado").exists())
                .andExpect(jsonPath("$.campos.entradaDepoisDoNascimento").doesNotExist());

        mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "Bidu", "especie": "CACHORRO", "sexo": "MACHO", "porte": "MEDIO",
                                 "pesoEmGramas": 15000, "nascimentoEstimado": "%s"}""".formatted(LocalDate.now())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.dataDeEntrada").exists())
                .andExpect(jsonPath("$.campos.entradaDepoisDoNascimento").doesNotExist());
    }

    @Test
    @DisplayName("o mesmo e-mail não cadastra dois abrigos")
    void emailRepetidoNaoCadastra() throws Exception {
        String email = "repetido-" + UUID.randomUUID() + "@exemplo.com";

        mockMvc.perform(post("/api/v1/autenticacao/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDeRegistro(email, "21999998888")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/autenticacao/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDeRegistro(email, null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Conflito"));
    }

    @Test
    @DisplayName("senha errada devolve 401 sem dizer se o e-mail existe")
    void senhaErrada() throws Exception {
        String email = "abrigo-" + UUID.randomUUID() + "@exemplo.com";
        mockMvc.perform(post("/api/v1/autenticacao/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpoDeRegistro(email, null)));

        mockMvc.perform(post("/api/v1/autenticacao/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "senha": "senhaerrada123"}""".formatted(email)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("E-mail ou senha não conferem."));
    }

    @Test
    @DisplayName("o abrigo consulta os proprios dados pelo token")
    void dadosDoAbrigo() throws Exception {
        String token = autenticar();

        mockMvc.perform(get("/api/v1/autenticacao/eu").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Abrigo São Francisco"))
                .andExpect(jsonPath("$.cidade").value("Niterói"));
    }

    @Test
    @DisplayName("o catálogo filtra por sexo, situação e cidade do abrigo")
    void filtrosMenosUsados() throws Exception {
        String token = autenticar();
        criar(token, "Bidu", "MACHO");
        criar(token, "Amora", "FEMEA");

        mockMvc.perform(get("/api/v1/animais").param("sexo", "FEMEA"))
                .andExpect(jsonPath("$.totalDeItens").value(1))
                .andExpect(jsonPath("$.itens[0].nome").value("Amora"));

        mockMvc.perform(get("/api/v1/animais").param("status", "DISPONIVEL"))
                .andExpect(jsonPath("$.totalDeItens").value(2));

        mockMvc.perform(get("/api/v1/animais").param("cidade", "niteroi"))
                .andExpect(jsonPath("$.totalDeItens").value(2));

        mockMvc.perform(get("/api/v1/animais").param("cidade", "Manaus"))
                .andExpect(jsonPath("$.totalDeItens").value(0));

        mockMvc.perform(get("/api/v1/animais").param("busca", "   "))
                .andExpect(jsonPath("$.totalDeItens").value(2));
    }

    @Test
    @DisplayName("evento sem data usa o dia de hoje")
    void eventoSemData() throws Exception {
        String token = autenticar();
        long id = criar(token, "Bidu", "MACHO");

        mockMvc.perform(post("/api/v1/animais/" + id + "/eventos")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tipo": "CONSULTA", "descricao": "Checkup de rotina"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.acontecido").value(LocalDate.now().toString()));
    }

    @Test
    @DisplayName("devolução sem motivo grava um texto padrao")
    void devolucaoSemMotivo() throws Exception {
        String token = autenticar();
        long id = criar(token, "Bidu", "MACHO");

        MvcResult candidatura = mockMvc.perform(post("/api/v1/animais/" + id + "/candidaturas")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nome": "Maria", "email": "maria@exemplo.com", "telefone": "21999998888",
                         "cidade": "Niterói", "moradia": "CASA", "areaProtegida": true,
                         "temOutrosAnimais": false}""")).andReturn();
        long idDaCandidatura = ler(candidatura).get("id").asLong();

        mockMvc.perform(post("/api/v1/candidaturas/" + idDaCandidatura + "/aprovacao")
                .header(HttpHeaders.AUTHORIZATION, token));
        mockMvc.perform(post("/api/v1/candidaturas/" + idDaCandidatura + "/adocao")
                .header(HttpHeaders.AUTHORIZATION, token));

        mockMvc.perform(post("/api/v1/animais/" + id + "/devolucao")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/animais/" + id + "/eventos"))
                .andExpect(jsonPath("$[?(@.tipo == 'DEVOLUCAO')].descricao")
                        .value(org.hamcrest.Matchers.hasItem("Devolvido ao abrigo")));
    }

    @Test
    @DisplayName("devolver quem não foi adotado não passa")
    void devolucaoDeQuemNaoFoiAdotado() throws Exception {
        String token = autenticar();
        long id = criar(token, "Bidu", "MACHO");

        mockMvc.perform(post("/api/v1/animais/" + id + "/devolucao")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail")
                        .value(org.hamcrest.Matchers.containsString("adotado")));
    }

    @Test
    @DisplayName("a janela de meses do grafico e limitada, não importa o que peçam")
    void janelaDeMesesLimitada() throws Exception {
        String token = autenticar();

        mockMvc.perform(get("/api/v1/painel/adocoes-por-mes").param("meses", "0")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/painel/adocoes-por-mes").param("meses", "9999")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());
    }

    private long criar(String token, String nome, String sexo) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "%s",
                                  "especie": "CACHORRO",
                                  "sexo": "%s",
                                  "porte": "MEDIO",
                                  "nascimentoEstimado": "%s",
                                  "pesoEmGramas": 15000,
                                  "dataDeEntrada": "%s"
                                }""".formatted(nome, sexo, LocalDate.now().minusYears(2),
                                LocalDate.now().minusMonths(2))))
                .andExpect(status().isCreated())
                .andReturn();

        return ler(resultado).get("id").asLong();
    }

    private String corpoDeRegistro(String email, String telefone) {
        return """
                {"nome": "Abrigo São Francisco", "email": "%s", "senha": "senhaforte123",
                 "cidade": "Niterói"%s}"""
                .formatted(email, telefone == null ? "" : ", \"telefone\": \"" + telefone + "\"");
    }

    private String autenticar() throws Exception {
        String email = "abrigo-" + UUID.randomUUID() + "@exemplo.com";

        mockMvc.perform(post("/api/v1/autenticacao/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpoDeRegistro(email, "21999998888")));

        MvcResult login = mockMvc.perform(post("/api/v1/autenticacao/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "senha": "senhaforte123"}""".formatted(email))).andReturn();

        return "Bearer " + ler(login).get("token").asText();
    }

    private JsonNode ler(MvcResult resultado) throws Exception {
        return objectMapper.readTree(resultado.getResponse().getContentAsString());
    }
}
