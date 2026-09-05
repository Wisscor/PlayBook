# PlayBook/back
### Recommended Project Structure
back/
└── app/
    ├── models/
    │   ├── user.py
    │   ├── post.py
    │   ├── comment.py
    │   └── message.py
    │
    ├── schemas/
    │   ├── user.py
    │   └── post.py
    │
    ├── api/
    ├── realtime/
    └── database/

# Endpoints
```
========================  
AUTH  
========================  
  
POST /auth/register  
POST /auth/login  
GET /auth/me  
  
  
========================  
USERS  
========================  
  
GET /users  
GET /users/{user_id}  
GET /users/{user_id}/posts  
PUT /users/{user_id}  
DELETE /users/{user_id}  
  
  
========================  
POSTS  
========================  
  
POST /posts  
GET /posts  
GET /posts/{post_id}  
PUT /posts/{post_id}  
DELETE /posts/{post_id}  
  
  
========================  
COMMENTS  
========================  
  
POST /posts/{post_id}/comments  
GET /posts/{post_id}/comments  
  
PUT /comments/{comment_id}  
DELETE /comments/{comment_id}  
  
  
========================  
LIKES  
========================  
  
POST /posts/{post_id}/like  
DELETE /posts/{post_id}/like  
GET /posts/{post_id}/likes  
  
  
========================  
DISLIKES  
========================  
  
POST /posts/{post_id}/dislike  
DELETE /posts/{post_id}/dislike  
GET /posts/{post_id}/dislikes  
  
  
========================  
CONVERSATIONS  
========================  
  
POST /conversations  
GET /conversations  
GET /conversations/{conversation_id}  
DELETE /conversations/{conversation_id}  
  
  
========================  
MESSAGES  
========================  
  
POST /conversations/{conversation_id}/messages  
GET /conversations/{conversation_id}/messages  
  
GET /messages/{message_id}  
DELETE /messages/{message_id}  
  
  
========================  
UPLOADS  
========================  
  
POST /upload/image
```