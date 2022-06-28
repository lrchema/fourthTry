async function loadJsonIntoCollection() {
  const response = await fetch("./blogsout.json");
  const json = await response.json();
  console.log(json);
  json["blogs"].forEach((element) => {
    db.collection("blogs")
    .doc(element["key"])
      .set({
        key: element["key"],
        week: element["week"],
        postedDate: element["postedDate"],
        notes: element["notes"],
      })
      .then(function (docRef) {
        console.log("Document written with ID: ", docRef);
      });
  });
}
loadJsonIntoCollection();
