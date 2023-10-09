class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      try {
        const sortField = this.queryString.sort;
        this.query = this.query.sort({ [sortField]: 'desc' });
      } catch (error) {
        console.error("Errore nell'ordinamento:", error);
      }
    } else {
      return (this.query = this.query.sort({ createdAt: -1 }));
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      //Eslcudiamo il campo __v del documento grazie al segno - (è un campo che aggiunge Mongodb ma che a noi non serve)
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1; // per 1 per convertirlo in numero
    const limit = this.queryString.limit * 1 || 100; //di default è 100
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
