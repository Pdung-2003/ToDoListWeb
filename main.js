// Import các module cần thiết
const express = require('express');
const bodyParser = require('body-parser');  // Thư viện phân tích cú pháp dữ liệu gửi lên
const path = require('path'); // xử lý đường dẫn file
var sql = require('mssql');
const fs = require('fs'); // Thư viện file system để làm việc với hệ thống file
const { connect } = require('http2');  // Thư viện quản lý session
const session = require('express-session');
const moment = require('moment-timezone');

// Khởi tạo ứng dụng Express
const app = express();

// Thiết lập middleware để phân tích cú pháp dữ liệu được gửi lên
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

// Cấu hình session cho ứng dụng
app.use(session({
    secret: 'phamdung',// Mật khẩu bí mật dùng để mã hóa thông tin session
    resave: true, // lưu lại session
    saveUninitialized: true
}));

// Cấu hình đường dẫn cho các trang HTML
const htmlDir = path.join(__dirname, 'view', 'Pages');

// Cấu hình kết nối cơ sở dữ liệu cho trang đăng nhập
const configForLogIn = {
    server: 'LAPTOP-POT66FBA',
    database: 'ToDolist',
    port: 1433,
    authentication: {
      type: 'default',
      options: {
        userName: 'sa',
        password: '123456'
      }
    },
    options: {
      encrypt: false,
      enableArithAbort: true
    }
};

// Kết nối với Db để lấy thông tin bảng Users
sql.connect(configForLogIn, function(err) {
    if (err) {
      console.log("Failed to connect to database: " + err);
    } else {
      console.log("Connected to database to get Users table info");
    }
});

// Định nghĩa các endpoint (route) và logic xử lý

// Endpoint đăng xuất
app.post('/logout', function(req, res) {
    // Ngắt kết nối config
    sql.close(function(err) {
      if (err) {
        console.log("Failed to close database connection: " + err);
      } else {
        console.log("Closed database connection");
      }
    });
  
    // Kết nối lại với CSDL
    sql.connect(configForLogIn, function(err) {
      if (err) {
        console.log("Failed to connect to database: " + err);
      } else {
        console.log("Connected to database to get Users table info");
      }
    });
  
    // Chuyển hướng người dùng về trang đăng nhập
    res.redirect('/login.html');
  });


// Endpoint đăng nhập
app.post('/login', function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  console.log('Handling login request...');
  
  // Tạo truy vấn SQL để kiểm tra thông tin đăng nhập
  const query = `SELECT * FROM Users WHERE UserName = '${username}' AND Password = '${password}'`;
  
  // Thực hiện truy vấn SQL
  const request = new sql.Request();
  request.query(query, function(err, result) {
    if (err) {
      console.log("Error executing SQL query: " + err);
      res.json({ success: false, message: "Error executing SQL query" });
    } else {
      // Kiểm tra kết quả truy vấn
      if (result.recordset.length > 0) {
        const userID = result.recordset[0].UserID; // lấy UserID
        req.session.userName = username; // lưu username và userID vào session
        req.session.userID = userID;
        // Đóng kết nối configForLogIn sau khi đăng nhập thành công
        sql.close(function(err) {
          if (err) {
            console.log("Failed to close database connection: " + err);
          } else {
            console.log("Closed database connection");
          }
        });
        // Thiết lập Db để thực hiện các chức năng khác
        const config = {
          server: 'LAPTOP-POT66FBA',
          database: 'ToDolist',
          port: 1433,
          authentication: {
            type: 'default',
            options: {
              userName: 'sa',
              password: '123456'
            }
          },
          options: {
            encrypt: false,
            enableArithAbort: true
          }
        };
        // Kết nối với Db để thực hiện các chức năng khác
        sql.connect(config, function(err) {
          if (err) {
            console.log("Failed to connect to database: " + err);
          } else {
            console.log("Connected to database for other functions");
          }
        });
        res.json({ success: true, message: "Login successful", userName: username });
        req.session.userID = userID;
      } else {
        res.json({ success: false, message: "Invalid username or password" });
      }
    }
  });
});
  
// Middleware xác thực
const authenticateUser = (req, res, next) => {
  const exemptedRoutes = ['/login.html', '/public-route1', '/public-route2'];
  
  if (exemptedRoutes.includes(req.path)) {
    next();
  } else {
    if (!req.session.userName) {
      // Nếu người dùng chưa đăng nhập, chuyển hướng về trang đăng nhập
      res.redirect('/login.html');
    } else {
      next();
    }
  }
};
  
// Reset lai cac ket noi khi dang xuat
module.exports = connect ;

// Định vị thư mục chứa các tệp tĩnh
app.use('/styles', express.static(path.join(__dirname, 'view', 'styles')));
app.use('/model', express.static(path.join(__dirname, 'model')));
app.use('/controller', express.static(path.join(__dirname, 'controller')));
app.use('/Images', express.static(path.join(__dirname, 'view', 'Images')));

// Middleware xác thực cho tất cả các route cung cấp tệp HTML
app.use(authenticateUser);

// Cấu hình engine render HTML và view engine
app.set('Pages', path.join(__dirname, 'Pages'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// Xử lý các yêu cầu truy cập các tệp HTML
app.use((req, res, next) => {
  const filePath = path.join(htmlDir, req.path);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });
});

// Route chính cho giao diện chính
app.get('/main', (req, res) => {
  // Code to handle the main interface
  res.sendFile(path.join(htmlDir, 'index.html'));
});

// Khởi động máy chủ
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

// lấy các task
app.get('/tasks', (req, res) => {
    const { date } = req.query; // Lấy ngày từ query string
    const userName = req.session.userName; // Lấy userName từ session

    if (!userName) {
        // Nếu không có userName, có nghĩa là người dùng chưa đăng nhập
        return res.status(401).send('User not authenticated');
    }
    // Tạo truy vấn SQL sử dụng parameterized query để lấy task theo userName và ngày
    const query = `
        SELECT * FROM Tasks
        WHERE CAST(CreateAt AS DATE) = @date
        AND UserID = (SELECT UserID FROM Users WHERE UserName = @userName)
        AND IsDeleted = 0
    `;

    const request = new sql.Request();
    request.input('date', sql.Date, date);
    request.input('userName', sql.NVarChar, userName);

    request.query(query, (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(result.recordset); // Trả về kết quả dưới dạng JSON
        }
    });
});
// Endpoint tìm kiếm task
app.get('/search-tasks', (req, res) => {
    const searchTerm = req.query.term;
    const userName = req.session.userName;

    if (!userName) {
        return res.status(401).send('User not authenticated');
    }

    // Tạo truy vấn SQL để tìm kiếm task
    const query = `
        SELECT * FROM Tasks
        WHERE TaskName LIKE @searchTerm
        AND UserID = (SELECT UserID FROM Users WHERE UserName = @userName)
        AND IsDeleted = 0
    `;

    const request = new sql.Request();
    request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
    request.input('userName', sql.NVarChar, userName);

    request.query(query, (err, result) => {
        if (err) {
            console.error('Error executing search query:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(result.recordset);
        }
    });
});

// Thêm API endpoint trên sever để xử lý add-task 
app.post('/add-task', (req, res) => {
    // Dữ liệu task từ body của request
    const { taskName, taskTime, date } = req.body;

    // UserID từ session, lưu trong session khi người dùng đăng nhập
    const userID = req.session.userID;
    const time = taskTime ? `${taskTime}:00` : '00:00:00';
    
    const createAt = moment.tz(`${date} ${time}`, 'Asia/Ho_Chi_Minh').toDate();

    // Tạo truy vấn SQL để thêm task
    const query = "INSERT INTO Tasks (TaskName, UserID, CreateAt) VALUES (@taskName, @userID, @date)";
    
    const request = new sql.Request();
    request.input('taskName', sql.NVarChar, taskName);
    request.input('userID', sql.NVarChar, userID);
    request.input('date', sql.DateTime, createAt);

    request.query(query, (err) => {
        if (err) {
            console.error('Error inserting task:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json({ success: true, message: "Task added successfully" });
        }
    });
});


// Endpoint này xử lý việc xóa một task
app.post('/delete-task', (req, res) => {
  const { taskID } = req.body;
  const userID = req.session.userID;

  if (!userID) {
    return res.status(401).send('Người dùng chưa được xác thực');
  }

  // Cập nhật trạng thái IsDeleted của task
  const query = "UPDATE Tasks SET IsDeleted = 1 WHERE TaskID = @taskID AND UserID = @userID";

  const request = new sql.Request();
  request.input('taskID', sql.NVarChar, taskID); 
  request.input('userID', sql.NVarChar, userID); 

  request.query(query, (err) => {
    if (err) {
      console.error('Lỗi khi cập nhật task:', err);
      res.status(500).send('Lỗi Server Nội Bộ');
    } else {
      res.json({ success: true, message: "Task đã được xóa thành công" });
    }
  });
});

// Endpoint này xử lý việc cập nhật trạng thái hoàn thành của task
app.post('/toggle-complete', (req, res) => {
  const { taskID } = req.body;
  const userID = req.session.userID;

  if (!userID) {
    return res.status(401).send('Người dùng chưa được xác thực');
  }

  // Cập nhật trạng thái IsCompleted của task
  const query = "UPDATE Tasks SET IsCompleted = 1 - IsCompleted WHERE TaskID = @taskID AND UserID = @userID";

  const request = new sql.Request();
  request.input('taskID', sql.NVarChar, taskID);
  request.input('userID', sql.NVarChar, userID);

  request.query(query, (err) => {
    if (err) {
      console.error('Lỗi khi cập nhật trạng thái hoàn thành của task:', err);
      res.status(500).send('Lỗi Server Nội Bộ');
    } else {
      res.json({ success: true, message: "Trạng thái task đã được cập nhật" });
    }
  });
});

// Lấy các task đã bị xóa
app.get('/deleted-tasks', (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
    return res.status(401).send('User not authenticated');
  }

  const query = `
      SELECT TaskName, CreateAt FROM Tasks
      WHERE UserID = @userID AND IsDeleted = 1
      ORDER BY CreateAt DESC
  `;

  const request = new sql.Request();
  request.input('userID', sql.NVarChar, userID);

  request.query(query, (err, result) => {
      if (err) {
          console.error('Error executing query:', err);
          res.status(500).send('Internal Server Error');
      } else {
          res.json(result.recordset);
      }
  });
});