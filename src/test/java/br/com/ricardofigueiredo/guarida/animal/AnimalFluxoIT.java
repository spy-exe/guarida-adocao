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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * As cinco operacoes que o enunciado manda demonstrar, exercitadas pelo
 * protocolo HTTP, com banco em memoria criado pelas mesmas migracoes do Flyway
 * que rodam em producao.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AnimalFluxoIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("cadastrar um animal devolve 201 com o id e a ficha preenchida")
    void cadastrar() throws Exception {
        String token = autenticar();

        mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDoAnimal("Bidu")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nome").value("Bidu"))
                .andExpect(jsonPath("$.especie").value("CACHORRO"))
                .andExpect(jsonPath("$.status").value("DISPONIVEL"))
                .andExpect(jsonPath("$.statusRotulo").value("Disponivel para adocao"))
                .andExpect(jsonPath("$.idadeRotulo").value("2 anos"))
                .andExpect(jsonPath("$.temperamentos[0].rotulo").value("Docil"))
                .andExpect(jsonPath("$.abrigo.nome").value("Abrigo Sao Francisco"));
    }

    @Test
    @DisplayName("consultar todos devolve a pagina do catalogo, sem exigir token")
    void consultarTodos() throws Exception {
        String token = autenticar();
        criar(token, "Bidu");
        criar(token, "Amora");

        mockMvc.perform(get("/api/v1/animais"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDeItens").value(2))
                .andExpect(jsonPath("$.itens.length()").value(2))
                .andExpect(jsonPath("$.pagina").value(0));
    }

    @Test
    @DisplayName("consultar pelo id devolve a ficha do animal, sem exigir token")
    void consultarPeloId() throws Exception {
        String token = autenticar();
        long id = criar(token, "Bidu");

        mockMvc.perform(get("/api/v1/animais/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value((int) id))
                .andExpect(jsonPath("$.nome").value("Bidu"));
    }

    @Test
    @DisplayName("id que nao existe devolve 404 no formato de problema")
    void idInexistente() throws Exception {
        mockMvc.perform(get("/api/v1/animais/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Recurso nao encontrado"))
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("999999")));
    }

    @Test
    @DisplayName("id que nem numero e devolve 400, e nao erro do servidor")
    void idQueNaoENumero() throws Exception {
        mockMvc.perform(get("/api/v1/animais/bidu"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Requisicao invalida"));
    }

    @Test
    @DisplayName("alterar troca os dados e registra a mudanca na linha do tempo")
    void alterar() throws Exception {
        String token = autenticar();
        long id = criar(token, "Bidu");

        mockMvc.perform(put("/api/v1/animais/" + id)
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Bidu Feliz",
                                  "especie": "CACHORRO",
                                  "raca": "Vira-lata caramelo",
                                  "sexo": "MACHO",
                                  "porte": "GRANDE",
                                  "nascimentoEstimado": "%s",
                                  "pesoEmGramas": 28000,
                                  "historia": "Ganhou peso e confianca",
                                  "castrado": true,
                                  "vacinado": true,
                                  "vermifugado": true,
                                  "temperamentos": ["BRINCALHAO", "BOM_COM_CRIANCAS"]
                                }""".formatted(LocalDate.now().minusYears(2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Bidu Feliz"))
                .andExpect(jsonPath("$.porte").value("GRANDE"))
                .andExpect(jsonPath("$.castrado").value(true))
                .andExpect(jsonPath("$.temperamentos.length()").value(2));

        mockMvc.perform(get("/api/v1/animais/" + id + "/eventos"))
                .andExpect(jsonPath("$[0].tipo").value("ENTRADA"))
                .andExpect(jsonPath("$[1].tipo").value("ATUALIZACAO"));
    }

    @Test
    @DisplayName("excluir devolve 204 e o animal some do catalogo")
    void excluir() throws Exception {
        String token = autenticar();
        long id = criar(token, "Bidu");

        mockMvc.perform(delete("/api/v1/animais/" + id).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/animais/" + id))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/animais"))
                .andExpect(jsonPath("$.totalDeItens").value(0));
    }

    @Test
    @DisplayName("sem token ninguem cadastra, altera nem exclui")
    void escritaExigeToken() throws Exception {
        String token = autenticar();
        long id = criar(token, "Bidu");

        mockMvc.perform(post("/api/v1/animais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDoAnimal("Intruso")))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/v1/animais/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDoAnimal("Bidu")))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/v1/animais/" + id))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Nao autenticado"));
    }

    @Test
    @DisplayName("um abrigo nao altera nem exclui o animal de outro")
    void isolamentoEntreAbrigos() throws Exception {
        String tokenDoDono = autenticar();
        long id = criar(tokenDoDono, "Bidu");

        String tokenDeOutro = autenticar();

        mockMvc.perform(put("/api/v1/animais/" + id)
                        .header(HttpHeaders.AUTHORIZATION, tokenDeOutro)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDoAnimal("Sequestrado")))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/animais/" + id).header(HttpHeaders.AUTHORIZATION, tokenDeOutro))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("campo obrigatorio faltando devolve 400 apontando o campo")
    void validacaoDeCampos() throws Exception {
        String token = autenticar();

        mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "", "pesoEmGramas": 5}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").isNotEmpty())
                .andExpect(jsonPath("$.campos.especie").isNotEmpty())
                .andExpect(jsonPath("$.campos.pesoEmGramas").isNotEmpty());
    }

    @Test
    @DisplayName("animal nao pode ter entrado no abrigo antes de nascer")
    void entradaAntesDoNascimento() throws Exception {
        String token = autenticar();

        mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Impossivel",
                                  "especie": "GATO",
                                  "sexo": "FEMEA",
                                  "porte": "PEQUENO",
                                  "nascimentoEstimado": "%s",
                                  "pesoEmGramas": 3000,
                                  "dataDeEntrada": "%s"
                                }""".formatted(LocalDate.now().minusMonths(1),
                                LocalDate.now().minusMonths(6))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.entradaDepoisDoNascimento").isNotEmpty());
    }

    @Test
    @DisplayName("corpo que nao e JSON devolve 400 explicando, e nao 500")
    void corpoIlegivel() throws Exception {
        String token = autenticar();

        mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("isso nao e json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("JSON")));
    }

    @Test
    @DisplayName("o catalogo filtra por especie, porte, filhote e busca livre")
    void filtrosDoCatalogo() throws Exception {
        String token = autenticar();
        criar(token, "Bidu");

        mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Amora",
                                  "especie": "GATO",
                                  "raca": "Siames",
                                  "sexo": "FEMEA",
                                  "porte": "PEQUENO",
                                  "nascimentoEstimado": "%s",
                                  "pesoEmGramas": 2500,
                                  "dataDeEntrada": "%s",
                                  "historia": "Encontrada dentro de um motor"
                                }""".formatted(LocalDate.now().minusMonths(4), LocalDate.now()
                                .minusMonths(2))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/animais").param("especie", "GATO"))
                .andExpect(jsonPath("$.totalDeItens").value(1))
                .andExpect(jsonPath("$.itens[0].nome").value("Amora"));

        mockMvc.perform(get("/api/v1/animais").param("porte", "MEDIO"))
                .andExpect(jsonPath("$.totalDeItens").value(1))
                .andExpect(jsonPath("$.itens[0].nome").value("Bidu"));

        mockMvc.perform(get("/api/v1/animais").param("apenasFilhotes", "true"))
                .andExpect(jsonPath("$.totalDeItens").value(1))
                .andExpect(jsonPath("$.itens[0].nome").value("Amora"));

        mockMvc.perform(get("/api/v1/animais").param("busca", "motor"))
                .andExpect(jsonPath("$.totalDeItens").value(1));

        mockMvc.perform(get("/api/v1/animais").param("busca", "papagaio"))
                .andExpect(jsonPath("$.totalDeItens").value(0));

        mockMvc.perform(get("/api/v1/animais").param("temperamento", "DOCIL"))
                .andExpect(jsonPath("$.totalDeItens").value(1))
                .andExpect(jsonPath("$.itens[0].nome").value("Bidu"));
    }

    @Test
    @DisplayName("suspender tira da vitrine e reativar devolve")
    void suspensaoEReativacao() throws Exception {
        String token = autenticar();
        long id = criar(token, "Bidu");

        mockMvc.perform(post("/api/v1/animais/" + id + "/suspensao")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INDISPONIVEL"));

        mockMvc.perform(post("/api/v1/animais/" + id + "/reativacao")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISPONIVEL"));
    }

    @Test
    @DisplayName("o abrigo registra vacina e castracao na linha do tempo")
    void registraEventos() throws Exception {
        String token = autenticar();
        long id = criar(token, "Bidu");

        mockMvc.perform(post("/api/v1/animais/" + id + "/eventos")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tipo": "VACINA", "descricao": "V10, primeira dose", "acontecido": "%s"}"""
                                .formatted(LocalDate.now().minusDays(10))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipoRotulo").value("Vacina"));

        mockMvc.perform(get("/api/v1/animais/" + id + "/eventos"))
                .andExpect(jsonPath("$.length()").value(2));
    }

    private long criar(String token, String nome) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDoAnimal(nome)))
                .andExpect(status().isCreated())
                .andReturn();

        return ler(resultado).get("id").asLong();
    }

    private String corpoDoAnimal(String nome) {
        return """
                {
                  "nome": "%s",
                  "especie": "CACHORRO",
                  "raca": "SRD",
                  "sexo": "MACHO",
                  "porte": "MEDIO",
                  "nascimentoEstimado": "%s",
                  "pesoEmGramas": 15000,
                  "dataDeEntrada": "%s",
                  "historia": "Resgatado na rodovia",
                  "temperamentos": ["DOCIL"]
                }""".formatted(nome, LocalDate.now().minusYears(2), LocalDate.now().minusMonths(1));
    }

    private String autenticar() throws Exception {
        String email = "abrigo-" + UUID.randomUUID() + "@exemplo.com";

        mockMvc.perform(post("/api/v1/autenticacao/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "Abrigo Sao Francisco", "email": "%s", "senha": "senhaforte123",
                                 "cidade": "Niteroi", "telefone": "21999998888"}""".formatted(email)))
                .andExpect(status().isCreated());

        MvcResult login = mockMvc.perform(post("/api/v1/autenticacao/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "senha": "senhaforte123"}""".formatted(email)))
                .andExpect(status().isOk())
                .andReturn();

        return "Bearer " + ler(login).get("token").asText();
    }

    private JsonNode ler(MvcResult resultado) throws Exception {
        return objectMapper.readTree(resultado.getResponse().getContentAsString());
    }
}
