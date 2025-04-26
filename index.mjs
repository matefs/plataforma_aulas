import express from 'express';
import lodash from 'lodash';
import { join, dirname } from 'path';
import { Low, JSONFile } from 'lowdb';
import { fileURLToPath } from 'url';

class LowWithLodash extends Low {
  chain = lodash.chain(this).get('data');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const adapter = new JSONFile(join(__dirname, 'db.json'));
const db = new LowWithLodash(adapter);

await db.read();
db.data ||= {}; // Banco de dados flexível para qualquer coleção

const app = express();
app.use(express.json());

// Middleware para verificar se a coleção existe
app.use('/:collection', async (req, res, next) => {
  const { collection } = req.params;
  await db.read();
  db.data[collection] ||= []; // Cria a coleção se não existir
  next();
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html')); // Use absolute path
});


const absoluteDirectoryPath = dirname(fileURLToPath(import.meta.url));
const authorizedUsername = 'admin';
const authorizedPassword = 'macacocego';

app.get('/admin', (req, res) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).send('Authentication required');
  }

  const base64Credentials = authorizationHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [submittedUsername, submittedPassword] = credentials.split(':');

  if (
    submittedUsername !== authorizedUsername ||
    submittedPassword !== authorizedPassword
  ) {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).send('Invalid credentials');
  }

  res.sendFile(join(absoluteDirectoryPath, 'admin.html'));
});



// Rota GET - Lista todos os itens de uma coleção
app.get('/:collection', async (req, res) => {
  const { collection } = req.params;
  res.json(db.data[collection]);
});

// Rota GET - Obter um item específico por ID dentro de uma coleção
app.get('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const item = db.chain
    .get(collection)
    .find({ id: Number(id) })
    .value();
  if (!item) return res.status(404).json({ message: 'Item não encontrado' });
  res.json(item);
});

// Rota POST - Criar um novo item dentro de uma coleção
app.post('/:collection', async (req, res) => {
  const { collection } = req.params;
  const newItem = { id: Date.now(), ...req.body };
  db.data[collection].push(newItem);
  await db.write();
  res.status(201).json(newItem);
});

// Rota PUT - Atualizar um item pelo ID dentro de uma coleção
app.put('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const index = db.data[collection].findIndex((item) => item.id === Number(id));
  if (index === -1)
    return res.status(404).json({ message: 'Item não encontrado' });

  db.data[collection][index] = { ...db.data[collection][index], ...req.body };
  await db.write();
  res.json(db.data[collection][index]);
});

// Rota DELETE - Remover um item pelo ID dentro de uma coleção
app.delete('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const index = db.data[collection].findIndex((item) => item.id === Number(id));
  if (index === -1)
    return res.status(404).json({ message: 'Item não encontrado' });

  db.data[collection].splice(index, 1);
  await db.write();
  res.json({ message: 'Item deletado com sucesso' });
});

// Rota GET - Obter uma aula específica de um módulo
app.get('/modules/:moduleId/lessons/:lessonId', async (req, res) => {
  const { moduleId, lessonId } = req.params;
  await db.read();
  const module = db.data.modules.find((m) => m.id === Number(moduleId));
  if (!module) return res.status(404).json({ message: 'Módulo não encontrado' });
  const lesson = module.lessons.find((l) => l.id === Number(lessonId));
  if (!lesson) return res.status(404).json({ message: 'Aula não encontrada' });
  res.json(lesson);
});

// Rota PUT - Atualizar uma aula específica de um módulo
app.put('/modules/:moduleId/lessons/:lessonId', async (req, res) => {
  const { moduleId, lessonId } = req.params;
  await db.read();
  const module = db.data.modules.find((m) => m.id === Number(moduleId));
  if (!module) return res.status(404).json({ message: 'Módulo não encontrado' });
  const lessonIndex = module.lessons.findIndex((l) => l.id === Number(lessonId));
  if (lessonIndex === -1) return res.status(404).json({ message: 'Aula não encontrada' });
  module.lessons[lessonIndex] = { ...module.lessons[lessonIndex], ...req.body };
  await db.write();
  res.json(module.lessons[lessonIndex]);
});

// Rota DELETE - Remover uma aula específica de um módulo
app.delete('/modules/:moduleId/lessons/:lessonId', async (req, res) => {
  const { moduleId, lessonId } = req.params;
  await db.read();
  const module = db.data.modules.find((m) => m.id === Number(moduleId));
  if (!module) return res.status(404).json({ message: 'Módulo não encontrado' });
  const lessonIndex = module.lessons.findIndex((l) => l.id === Number(lessonId));
  if (lessonIndex === -1) return res.status(404).json({ message: 'Aula não encontrada' });
  module.lessons.splice(lessonIndex, 1);
  await db.write();
  res.json({ message: 'Aula removida com sucesso' });
});

// Rota POST - Criar uma nova aula dentro de um módulo
app.post('/modules/:moduleId/lessons', async (req, res) => {
  const { moduleId } = req.params;
  const newLesson = { id: Date.now(), ...req.body };
  await db.read();
  const module = db.data.modules.find((m) => m.id === Number(moduleId));
  if (!module) return res.status(404).json({ message: 'Módulo não encontrado' });
  module.lessons.push(newLesson);
  await db.write();
  res.status(201).json(newLesson);
});

// Iniciar o servidor
const PORT = 1234;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
