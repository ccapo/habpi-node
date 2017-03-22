'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('message_type', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      field: 'id'
    },
    name: {
      type: DataTypes.STRING,
      field: 'name'
    },
    description: {
      type: DataTypes.STRING,
      field: 'description'
    }
  }, {
    freezeTableName: true,
    timestamps: false
  });
};