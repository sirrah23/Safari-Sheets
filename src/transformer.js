/*
* This module will convert an array of
* objects to an array of arrays where
* each element is an array of length 2.
* The first element is a book title and
* the second element is the % of the book
* that has been read.
*
* The data is converted in this way because
* the Google Sheets API expects an array
* of arrays, not an array of objects.
*/
module.exports = (book_data) => {
  const valOrDef = (val, def) => val || def;
  return book_data.map((b) => [valOrDef(b.title, ""), valOrDef(b.pctread, "0%")]);
};