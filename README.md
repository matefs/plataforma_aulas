

### Create new registers: 
- ```curl -X POST http://localhost:3000/posts -H "Content-Type: application/json" -d '{"title": "asdfasdf","description": "descricao"}'```


```
curl -X POST http://localhost:3000/modules/1/lessons \\n-H "Content-Type: application/json" \\n-d '{\n  "title": "Nova Aula de JavaScript",\n  "youtubeId": "abc123",\n  "description": "Aprenda conceitos avançados de JavaScript."\n}'

curl -X DELETE http://localhost:3000/modules/1/lessons/1745633681257
``` 