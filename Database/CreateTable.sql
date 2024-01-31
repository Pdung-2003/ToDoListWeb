CREATE TABLE Users (
	STT INT IDENTITY(1, 1),
    UserID AS CONVERT(NVARCHAR(10), 'DU' + RIGHT('00000' + CAST(STT AS VARCHAR(5)), 5)) PERSISTED PRIMARY KEY,
    UserName NVARCHAR(50),
    Password NVARCHAR(255),
    Email NVARCHAR(100),
    CreateAt DATETIME DEFAULT GETDATE()
);


INSERT INTO Users (UserName, Password, Email)
VALUES
    ('user1', 'password1', 'user1@gmail.com'),
    ('user2', 'password2', 'user2@gmail.com'),
    ('user3', 'password3', 'user3@gmail.com')

CREATE TABLE Tasks (
	STT INT IDENTITY(1, 1),
    TaskID AS CONVERT(NVARCHAR(10), 'DL' + RIGHT('00000' + CAST(STT AS VARCHAR(5)), 5)) PERSISTED PRIMARY KEY,
    TaskName NVARCHAR(255),
	UserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
	CreateAt DATETIME,
    IsCompleted BIT NOT NULL DEFAULT 0,
    IsDeleted BIT NOT NULL DEFAULT 0 
);
INSERT INTO Tasks (TaskName, UserID, CreateAt, IsCompleted, IsDeleted)
VALUES
('Task 1', 'DU00001', '2024-01-11T08:00:00', 0, 0),
('Task 2', 'DU00001', '2024-01-11T09:00:00', 0, 0),
('Task 3', 'DU00001', '2024-01-11T10:00:00', 0, 0),
('Task 4', 'DU00001', '2024-01-11T11:00:00', 0, 0),
('Task 5', 'DU00001', '2024-01-11T12:00:00', 0, 0);

