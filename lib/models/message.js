'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('message', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      field: 'id'
    },
    sensor_type_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'sensor_type',
        key: 'id'
      }
    },
    message_type_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'message_type',
        key: 'id'
      }
    },
    message: {
      type: DataTypes.STRING,
      field: 'message'
    },
    created_at: {
      type: DataTypes.DATE,
      field: 'created_at'
    }
  }, {
    freezeTableName: true,
    timestamps: false
  });
};