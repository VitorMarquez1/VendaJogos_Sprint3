const axios = require('axios');
const fs = require('fs');

const RAWG_API_KEY = '3d41ef14468645628b28ce846179e583';
const GAMES_TO_FETCH = 100;
const PROBLEMATIC_GAME_ID = 407559; // ID do Soulcalibur (1998) que queremos excluir

const genreMap = {
    "Action": "Ação", "Indie": "Indie", "Adventure": "Aventura", "RPG": "RPG", "Strategy": "Estratégia",
    "Shooter": "Tiro", "Casual": "Casual", "Simulation": "Simulação", "Puzzle": "Puzzle", "Arcade": "Arcade",
    "Platformer": "Plataforma", "Racing": "Corrida", "Massively Multiplayer": "MMO", "Sports": "Esportes",
    "Fighting": "Luta", "Family": "Família", "Board Games": "Jogos de Tabuleiro", "Educational": "Educacional",
    "Card": "Cartas"
};

function getRandomPrice(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}

async function populateDatabase() {
    console.log('Iniciando a geração do banco de dados...');
    if (RAWG_API_KEY === 'SUA_API_KEY_VEM_AQUI' || !RAWG_API_KEY) {
        console.error('ERRO: Por favor, adicione sua API Key da RAWG na variável RAWG_API_KEY.');
        return;
    }

    try {
        // --- ETAPA 1: Buscar jogos da API externa ---
        console.log(`Buscando ${GAMES_TO_FETCH} jogos da API RAWG...`);
        let games = [];
        let page = 1;
        while (games.length < GAMES_TO_FETCH) {
            const response = await axios.get(`https://api.rawg.io/api/games`, {
                params: { key: RAWG_API_KEY, page_size: 40, page: page++, ordering: '-metacritic' }
            });
            if (response.data.results.length === 0) break;
            games.push(...response.data.results);
        }
        games = games.slice(0, GAMES_TO_FETCH);

        // --- NOVO FILTRO PARA EXCLUIR O JOGO ---
        const initialCount = games.length;
        games = games.filter(game => game.id !== PROBLEMATIC_GAME_ID);
        if(games.length < initialCount) {
            console.log(`Jogo problemático com ID ${PROBLEMATIC_GAME_ID} foi encontrado e removido da lista.`);
        }

        const processedGames = games.map(game => {
            const imageUrl = game.background_image || 
                             (game.short_screenshots && game.short_screenshots.length > 0 ? game.short_screenshots[0].image : null);

            return {
                id: game.id, name: game.name, price: parseFloat(getRandomPrice(50, 350)),
                description: `Um jogo aclamado com nota ${game.metacritic || 'N/A'} no Metacritic. Lançado em ${new Date(game.released).toLocaleDateString()}.`,
                image: imageUrl, category: 'jogo', genre: (genreMap[game.genres[0]?.name] || 'N/A'),
                platform: game.platforms.map(p => p.platform.name).join(' / '),
                stock: Math.floor(Math.random() * 50) + 10, reviews: []
            };
        });
        console.log(`${processedGames.length} jogos foram processados.`);

        // --- ETAPA 2: Ler a lista de acessórios do arquivo local 'acessorios.json' ---
        console.log("Lendo a lista de acessórios de 'acessorios.json'...");
        let accessories = [];
        if (fs.existsSync('acessorios.json')) {
            const accessoriesData = fs.readFileSync('acessorios.json');
            accessories = JSON.parse(accessoriesData);
            console.log(`${accessories.length} acessórios foram carregados do arquivo.`);
        } else {
            console.warn("Aviso: Arquivo 'acessorios.json' não encontrado.");
        }

        // --- ETAPA 3: Juntar tudo e salvar ---
        const allProducts = [...processedGames, ...accessories];
        const finalDatabase = { products: allProducts, users: [], orders: [] };

        console.log('Gerando o arquivo final db.json...');
        fs.writeFileSync('db.json', JSON.stringify(finalDatabase, null, 2));

        console.log(`\nSUCESSO! 🚀 O arquivo db.json foi atualizado com ${allProducts.length} produtos no total.`);

    } catch (error) {
        console.error('\nOcorreu um erro geral:', error.message);
    }
}

populateDatabase();