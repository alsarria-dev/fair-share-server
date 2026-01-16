# Fair Share - Server

<br>
<div style="text-align:center"><img src="./blueLogo.png" alt="isolated" width="300"/></div>

## Introduction

Fair share is the culmination of the knowledge that Kiowa and myself have acquaired in Ironhacks's web development bootcamp. This application aims to provide a structured and scalable way to handle expenses of any kind through groups, users and expense type management.

The application is built on react and its entire functionalities expand across the MERN tech stack (see below), and uses also other different technologies that we will review below in more detail:

- [MongdoDB](https://www.mongodb.com/)
- [Express](https://expressjs.com/)
- [React](https://react.dev/)
- [Node](https://nodejs.org/en)

In this documentation we will mainly focused about server details and functionalities.

## Functionalities

1. Back-end connects to our client and database and is in charge to provide the necessary resources to our app.
2. Password encryption functionality is enabled via bcrypt library.
3. Authentification process implemented via Json Web Token (JWT) library.
4. Error handling via response.
5. Connected database has 3 main data collections to feed the app
   - References across collections are built for two of them. Collections are:
     - Users
     - Groups (referenced created with Expenses)
     - Expenses (referenced created with Groups)

## Endpoints

Multiple endpoint routes are created for a smooth communication between client, server and database. Routes information below:

- Auth:
  - `GET`
    ```
    - "/auth/verify/" -- verifies user
    ```
  - `POST`
    ```
    - "/auth/signup" -- creates new user in Users collection
    - "/auth/login" -- allows user to access the app
    ```
- Users:
  - `GET`
    ```
    - "/user/" -- retrieves all the users of the app
    - "/user/:userId" -- retrieves specific app user
    ```
  - `PUT`
    ```
    - "/user/:userId" -- update specific app user information
    ```
- Groups:
  - `GET`
    ```
    - "/groups/:userId" -- retrieves all the groups that a user is part of
    - "/groups/details/:groupId" -- retrieves specific group details
    ```
  - `POST`
    ```
    - "/groups/" -- creates new expense groups
    ```
  - `PUT`
    ```
    - "/groups/:groupId" -- updates group expense information
    ```
  - `DELETE`
    ```
    - "/groups/:groupId" -- deletes specific expense group
    ```
- Expenses:
  - `GET`
    ```
    - "/details/:expenseId" -- retrieves specific expense details
    ```
  - `POST`
    ```
    - "/expenses/" -- creates new expense
    ```
  - `PUT`
    ```
    - "/expenses/:expenseId" -- updates group expense
    ```
  - `DELETE`

    ```
    - "/expenses/:expenseId" -- deletes specific expense

    ```

## Tech Stack

- `MongoDB`
  - Non-relation database used to store the app information.
- `Express`
  - JavaScript back-end framework to design and generate our server.
- `NodeJS`
  - Runtime environment to execute JavaScript in the server.
- `Mongoose`
  - JavaScript library to communicate with MongoDB databse.
- `Ironlauncher`
  - Project generator for setting up the server.
- `JavaScript`
  - Main language used to develop this software.
- `JSON Web Token (JWT)`
  - Enables authentification process for application users.
- `Bcrypt`
  - Provide password encryption services.
- `Deloplyment`
  - [Vercel](https://vercel.com/) -- Back-end deployment

## Version History

Check the list of [commits](https://github.com/alvsarria/fair-share-server/commits/main/) to see the history of the versions or the design history of our app.

## Authors

- Lee Kiowa Roy Fiala
  - [LinkedIn](https://www.linkedin.com/in/lee-kiowa-fiala/)
  - [GitHub](https://github.com/kiowafg/)
- Alvaro Sarria Rico
  - [LinkedIn](https://www.linkedin.com/in/alsarria-dev/)
  - [GitHub](https://github.com/alvsarria)

## Acknowledgements

- Marcel Bosch Espin
- Nisol Medina Perozo
- Tania Futakova
- Mikel Jimenez Calcedo
- Arnaldo Mera Rojas
