export const queries = {
    initEventTablesql : 'CREATE TABLE "Events" ("ID" INTEGER NOT NULL UNIQUE, "Date" TEXT NOT NULL CHECK(datetime("Date") IS NOT NULL),"Name" TEXT, PRIMARY KEY("ID" AUTOINCREMENT))',
    initAttendeeTableSql : 'CREATE TABLE "Attendees" ("ID" INTEGER NOT NULL UNIQUE, "EventID" INTEGER NOT NULL, "Name" TEXT NOT NULL, PRIMARY KEY("ID" AUTOINCREMENT))',
    initVotesTableSql : 'CREATE TABLE "GameVotes" ("ID" INTEGER NOT NULL, "EventID" INTEGER NOT NULL, "AttendeeID" INTEGER NOT NULL, "Vote" TEXT NOT NULL,PRIMARY KEY("ID","EventID","AttendeeID"))',
    allEventsSql : 'SELECT * FROM Events',
    checkIfExistsSql : 'SELECT * FROM Events WHERE ID = ?',
    createEventSql : 'INSERT INTO Events(Date, Name) VALUES(?,?)',
    getEventDetailSql : 'SELECT e.ID, e.Name, e.Date, IFNULL(gv.Vote, \'Any\') AS TopVote FROM Events e OUTER LEFT JOIN GameVotes gv ON gv.EventID = e.ID WHERE e.ID = ? GROUP BY gv.Vote ORDER BY count(*) DESC LIMIT 1',
    updateEventSql : 'UPDATE Events SET Name = ?, Date = ? WHERE ID = ?',
    deleteEventsql : 'DELETE FROM Events WHERE ID = ?',
    addAttendeeSql : 'INSERT INTO Attendees(EventId,Name) VALUES(?,?)',
    addVoteSql : 'INSERT INTO GameVotes(ID,EventID,AttendeeID,Vote) VALUES((SELECT IFNULL(MAX(ID) + 1, 1) FROM GameVotes ORDER BY ID DESC),?,?,?)',
    deleteAttendeeSql : 'DELETE FROM Attendees WHERE EventId = ? AND ID = ?',
    deleteVoteSql : 'DELETE FROM GameVotes WHERE EventId = ? AND AttendeeID = ?',
    allAttendeesSql : 'SELECT a.ID, a.Name, gv.Vote FROM GameVotes gv INNER JOIN Attendees a ON a.ID = gv.AttendeeID WHERE gv.EventID = ?',
    updateAttendeeSql: 'UPDATE Attendees SET Name = ? WHERE ID = ? AND EventID = ?',
    updateVoteSql : 'UPDATE GameVotes SET Vote = ? WHERE AttendeeID = ? AND EventID = ?'
}
