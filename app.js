const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");
var isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertTodoObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

const authenticateStatusQuery = (request, response, next) => {
  const { status } = request.query;
  const statusText = ["TO DO", "IN PROGRESS", "DONE"];
  if (status !== undefined) {
    if (statusText.includes(status)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    next();
  }
};

const authenticatePriorityQuery = (request, response, next) => {
  const { priority } = request.query;
  const priorityText = ["HIGH", "MEDIUM", "LOW"];
  if (priority !== undefined) {
    if (priorityText.includes(priority)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    next();
  }
};

const authenticateCategoryQuery = (request, response, next) => {
  const { category } = request.query;
  const categoryText = ["WORK", "HOME", "LEARNING"];
  if (category !== undefined) {
    if (categoryText.includes(category)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    next();
  }
};

const authenticateDateQuery = (request, response, next) => {
  const { date } = request.query;
  if (date !== undefined) {
    if (isValid(new Date(date))) {
      let formatDate = format(new Date(date), "yyyy-MM-dd");
      request.dueDate = formatDate;
      next();
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    next();
  }
};

const authenticateStatus = (request, response, next) => {
  const { status } = request.body;
  const statusText = ["TO DO", "IN PROGRESS", "DONE"];
  if (status !== undefined) {
    if (statusText.includes(status)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    next();
  }
};

const authenticatePriority = (request, response, next) => {
  const { priority } = request.body;
  const priorityText = ["HIGH", "MEDIUM", "LOW"];
  if (priority !== undefined) {
    if (priorityText.includes(priority)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    next();
  }
};

const authenticateCategory = (request, response, next) => {
  const { category } = request.body;
  const categoryText = ["WORK", "HOME", "LEARNING"];
  if (category !== undefined) {
    if (categoryText.includes(category)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    next();
  }
};

const authenticateDate = (request, response, next) => {
  const { dueDate } = request.body;
  //   let dateObj = new Date(dueDate);
  //   Date.prototype.isValid = () => {
  //     return this.getTime() === this.getTime();
  //   };
  function dateIsValid(date) {
    return date instanceof Date && !isNaN(date);
  }
  if (dueDate !== undefined) {
    if (dateIsValid(new Date(dueDate))) {
      let formatDate = format(new Date(dueDate), "yyyy-MM-dd");
      request.addDate = formatDate;
      next();
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    next();
  }
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasStatusAndCategory = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

// Get todo API
app.get(
  "/todos/",
  authenticateStatusQuery,
  authenticatePriorityQuery,
  authenticateCategoryQuery,
  async (request, response) => {
    const { search_q = "", category, priority, status } = request.query;
    let selectTodoQuery = "";
    switch (true) {
      case hasPriorityAndStatus(request.query):
        selectTodoQuery = `select * from todo where todo LIKE '%${search_q}%' AND priority LIKE '${priority}' AND status LIKE '${status}';`;
        break;
      case hasPriorityAndCategory(request.query):
        selectTodoQuery = `select * from todo where todo LIKE '%${search_q}%' AND priority LIKE '${priority}' AND category LIKE '${category}';`;
        break;
      case hasStatusAndCategory(request.query):
        selectTodoQuery = `select * from todo where todo LIKE '%${search_q}%' AND status LIKE '${status}' AND category LIKE '${category}';`;
        break;
      case hasPriority(request.query):
        selectTodoQuery = `select * from todo where todo LIKE '%${search_q}%' AND priority LIKE '${priority}';`;
        break;
      case hasStatus(request.query):
        selectTodoQuery = `select * from todo where todo LIKE '%${search_q}%' AND status LIKE '${status}';`;
        break;
      case hasCategory(request.query):
        selectTodoQuery = `select * from todo where todo LIKE '%${search_q}%' AND category LIKE '${category}';`;
        break;
      default:
        selectTodoQuery = `select * from todo where todo LIKE '%${search_q}%';`;
        break;
    }
    const todoArray = await db.all(selectTodoQuery);
    response.send(todoArray.map((eachTodo) => convertTodoObject(eachTodo)));
  }
);

//Get todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertTodoObject(todo));
});

//Get todo date API
app.get("/agenda/", authenticateDateQuery, async (request, response) => {
  const { dueDate } = request;
  const getTodoQuery = `select * from todo where due_date = '${dueDate}';`;
  const todoArray = await db.all(getTodoQuery);
  response.send(todoArray.map((eachTodo) => convertTodoObject(eachTodo)));
});

//Add todo API
app.post(
  "/todos/",
  authenticateStatus,
  authenticatePriority,
  authenticateCategory,
  authenticateDate,
  async (request, response) => {
    const { addDate } = request;
    const { id, todo, priority, status, category } = request.body;
    const addTodoQuery = `
  INSERT INTO
   todo(id,todo,priority,status,category,due_date)
   VALUES(${id},'${todo}','${priority}','${status}','${category}','${addDate}');`;
    await db.run(addTodoQuery);
    response.send("Todo Successfully Added");
  }
);

//update todo API
app.put(
  "/todos/:todoId/",
  authenticateStatus,
  authenticatePriority,
  authenticateCategory,
  authenticateDate,
  async (request, response) => {
    const { todoId } = request.params;
    let updateColumn = "";
    const requestBody = request.body;
    switch (true) {
      case requestBody.status !== undefined:
        updateColumn = "Status";
        break;
      case requestBody.priority !== undefined:
        updateColumn = "Priority";
        break;
      case requestBody.todo !== undefined:
        updateColumn = "Todo";
        break;
      case requestBody.category !== undefined:
        updateColumn = "Category";
        break;
      case requestBody.dueDate !== undefined:
        updateColumn = "Due Date";
        break;
    }

    const getTodoQuery = `select * from todo where id = ${todoId};`;
    const previousTodo = await db.get(getTodoQuery);
    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
      category = previousTodo.category,
      dueDate = previousTodo.due_date,
    } = request.body;
    const updateTodoQuery = `UPDATE todo 
     SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
      WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  }
);

//Delete Todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
