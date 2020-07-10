const express = require('express');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const pino = require('express-pino-logger')();
const path = require('path');
const moment = require('moment');

const getCondition = require('./query_condition');

/* ---------------------------------
   setup database
-----------------------------------*/

const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './cts.sqlite'
});

sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

const User = sequelize.define(
    'User',
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        first_name: Sequelize.STRING,
        last_name: Sequelize.STRING,
        email: Sequelize.STRING,
        user_name: Sequelize.STRING,
        role: Sequelize.STRING,
        password: Sequelize.STRING,
    });

const Project = sequelize.define(
    'Project',
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.STRING,
        abbrev: Sequelize.STRING,
        study_design: Sequelize.STRING,
        endpoint: Sequelize.STRING,
        biospecimens: Sequelize.BOOLEAN,
        geospatial_data: Sequelize.BOOLEAN,
        data_sharing: Sequelize.BOOLEAN,
        cancer_endpoint: Sequelize.TEXT,
        start_of_follow_up: Sequelize.TEXT,
        censoring_rules: Sequelize.TEXT,
        questionnarie: Sequelize.TEXT
    });

User.belongsToMany(Project, {through: 'User_Project', as: 'projects'});
Project.belongsToMany(User, {through: 'User_Project', as: 'users'});

const seed = () => {
    return Promise.all([
        User.create({
            first_name: 'Normal',
            last_name: 'User',
            email: 'user@coh.org',
            role: 'user',
        }),
        User.create({
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@coh.org',
            role: 'admin',
            password: '1234',
        }),
        Project.create({
            name: 'Doe Breast Cancer Risk and Air Pollution',
            abbrev: 'DOEBCR',
            study_design: 'Cohort',
            endpoint: 'Cancer',
            biospecimens: true,
            geospatial_data: false,
            data_sharing: false,
        }),
        Project.create({
            name: 'Head and Neck Cancer Study',
            abbrev: 'HNCS',
            study_design: 'Case-Control',
            endpoint: 'Hospitalization',
            biospecimens: false,
            geospatial_data: true,
            data_sharing: false,
        }),
        Project.create({
            name: 'Lung Cancel Risk and Smoking ',
            abbrev: 'LCRS',
            study_design: 'Cross-Sectional',
            endpoint: 'Mortality',
            biospecimens: true,
            geospatial_data: true,
            data_sharing: false,
        })
    ]).then(([user, admin, DOEBCR, HNCS, LCRS]) => {
        return Promise.all([
            user.setProjects([DOEBCR, HNCS, LCRS]),
            admin.setProjects([DOEBCR, HNCS]),
        ]);
    }).catch(error => console.log(error));
};

const users = require('../src/model/users');
const init = () => {
    for (var i = 0; i < users.length; i++) {
        console.log(JSON.stringify(users[i]));
        User.create(users[i]);
    }
}

sequelize.sync({force: false})
//.then(() => init())
//.then(() => seed())
    .then(() => User.findAll({include: [{model: Project, as: 'projects'}]}))
    .then(users => console.log(JSON.stringify(users)))
    .then(() => Project.findAll())
    .then(projects => console.log(JSON.stringify(projects)))
    .then(() => User.findOne({
        where: {id: 1},
        include: [{model: Project, as: 'projects'}]
    }))
    .then(user => {
        console.log("------------------------------");
        console.log(JSON.stringify(user.projects));
    })
    .then(() => Project.findOne({
        where: {id: 1},
        include: [{model: User, as: 'users'}]
    }))
    .then(project => {
        console.log("------------------------------");
        console.log(JSON.stringify(project.users));
        //project.users[0].setProjects([]);
        //project.setUsers([]);yec
    })
    .catch(error => console.log(error));


/* ---------------------------------
   setup Express
-----------------------------------*/

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(expressSession({secret: 'curiousjoe', resave: true, saveUninitialized: true}));
app.use(pino);
app.use(express.static(path.join(__dirname, '..', 'build')));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/api/user', (req, res) => {
    let query = {
        include: [
            {model: Project, as: 'projects'},
        ],
        order: [
            ['last_name', 'ASC'],
            ['first_name', 'ASC'],
        ],
    }
    if (req.query.email) {
        query['where'] = {
            email: req.query.email
        }
    }
    User.findAll(query)
        .then(users => {
            for (var i = 0; i < users.length; i++) {
                users[i].password = undefined;
            }
            res.setHeader('Content-Type', 'application/json');

            if (users && users.length > 1) {
                if (req.session.user && req.session.user.role === 'admin') {
                    // only admin can see multiple users
                    res.send(JSON.stringify(users));
                } else {
                    res.json({Error: 'Not authenticated'});
                }
            } else {
                // single user
                if (users && users.length === 1 && users[0].role !== 'admin') {
                    req.session.user = users[0];
                }
                res.send(JSON.stringify(users));
            }
        })
});

app.post('/api/login', (req, res) => {
    let email = req.body.params.email;
    let password = req.body.params.password;
    let query = {
        include: [
            {model: Project, as: 'projects'},
        ],
    }
    query['where'] = {
        email: email,
        password: password
    };
    User.findOne(query)
        .then(user => {
            if (user) {
                req.session.user = user;
            }
            res.setHeader('Content-Type', 'application/json');
            res.json(user);
        })
});

app.post('/api/logout', (req, res) => {
    let email = req.body.params.email;
    if (req.session && req.session.user && req.session.user.email === email) {
        req.session.user = undefined;
        res.json({OK: true});
    }
});

app.get('/api/project', (req, res) => {
    let query = {
        include: [
            {model: User, as: 'users'},
        ],
        order: [
            ['name', 'ASC']
        ],
    }
    Project.findAll(query)
        .then(projects => {
            for (var j = 0; j < projects.length; j++) {
                for (var i = 0; i < projects[j].users.length; i++) {
                    projects[j].users[i].password = undefined;
                }
            }

            res.setHeader('Content-Type', 'application/json');
            if (req.session.user) {
                if (req.session.user.role === 'admin') {
                    res.json(projects);
                } else {
                    let output_projects = [];
                    for (var j = 0; j < projects.length; j++) {
                        var found = false;
                        for (var i = 0; i < projects[j].users.length; i++) {
                            if (projects[j].users[i].email === req.session.user.email) {
                                found = true;
                                break;
                            }
                        }
                        if (found) {
                            output_projects.push(projects[j]);
                        }
                    }

                    res.json(output_projects);
                }
            } else {
                res.json(projects);
            }
        })
});

app.post('/api/project', (req, res) => {

    if (req.session.user && req.session.user.role === 'admin') {
        let input_project = req.body;
        let preselected = {
            "Q1": {
                "age_at_baseline": true,
                "adopted": true,
                "twin": true,
                "birthplace": true,
                "birthplace_mom": true,
                "birthplace_dad": true,
                "participant_race": true,
                "nih_ethnic_cat": true,
                "age_mom": true,
                "age_dad": true,
                "FMP": true,
                "ROCYN15": true,
                "RTOCYRS15": true,
                "EVPRG": true,
                "AGEFFTP": true,
                "TOTPRG": true,
                "RMENOVARC": true,
                "HEIGHTX": true,
                "WEIGHTX": true,
                "bmi": true,
                "DIABSELF": true,
                "HIPFSELF": true,
                "SPMP3YR": true,
                "SPMHRLT": true,
                "vitgrp": true,
                "ALCYRC": true,
                "SMKEXP": true,
                "TYRSSMK": true,
                "AVGCIGDY": true,
                "TPACKYRS": true
            }, "Q2": {}, "Q3": {}, "Q4": {}, "Q4mini": {}, "Q5": {}, "Q5mini": {}, "Q6": {}
        };
        input_project.questionnarie = JSON.stringify(preselected);
        Project.create(input_project).then(
            project => {
                if (req.body.users && req.body.users.length > 0) {
                    let conditions = [];
                    for (var i = 0; i < req.body.users.length; i++) {
                        conditions.push({id: req.body.users[i].id});
                    }
                    const {Op} = require("sequelize");
                    User.findAll({
                        where: {[Op.or]: conditions}
                    }).then(users => {
                        project.setUsers(users);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(project));
                    })
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(project));
                }
            }
        )
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.json({Error: 'No permission to create a new project'});
    }
});

app.get('/api/project/:id', (req, res) => {
    const id = req.params.id;
    Project.findOne({
        where: {id: id},
        include: [
            {model: User, as: 'users'},
        ],
    }).then(project => {

        if (project) {

            for (var i = 0; i < project.users.length; i++) {
                project.users[i].password = undefined;
            }

            res.setHeader('Content-Type', 'application/json');
            if (req.session.user) {
                if (req.session.user.role === 'admin') {
                    res.json(project);
                } else {
                    var found = false;
                    for (var i = 0; i < project.users.length; i++) {
                        if (project.users[i].email === req.session.user.email) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        res.json(project);
                    } else {
                        res.json([]);
                    }
                }
            } else {
                res.json([]);
            }
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json([]);
        }
    });
});


app.post('/api/summary/total', (req, res) => {

    let sql = 'SELECT count(DISTINCT SSAP_ID) as TOTAL FROM ssap_data WHERE ' +
        getCondition(req.body.cancer_endpoint, req.body.start_of_follow_up, req.body.censoring_rules);

    if (
        (req.body.cancer_endpoint !== undefined &&
            req.body.cancer_endpoint !== null &&
            req.body.cancer_endpoint !== 'null' &&
            req.body.cancer_endpoint.length > 0)
        ||
        (req.body.start_of_follow_up !== undefined &&
            req.body.start_of_follow_up !== null &&
            req.body.start_of_follow_up !== 'null')
        ||
        (req.body.censoring_rules !== undefined &&
            req.body.censoring_rules !== null &&
            req.body.censoring_rules !== 'null')
    ) {
    } else {
        sql += " AND 1=0 ";
    }

    console.log("---------------------------");
    console.log(sql);

    sequelize.query(
        sql,
        {
            type: sequelize.QueryTypes.SELECT
        })
        .then(result => {
            res.json(result);
        });

});


app.post('/api/summary/diagnosis_age', (req, res) => {

    /*
    let sql = 'SELECT DATE_DT, DATE_OF_BIRTH_DT FROM ssap_data WHERE ' +
        getCondition(req.body.cancer_endpoint, req.body.start_of_follow_up);
     */

    let sql = 'SELECT DISTINCT cast(strftime(\'%Y\', date(DATE_DT))as integer) as year,  ' +
        ' cast(round((julianday(DATE_DT)-julianday(DATE_OF_BIRTH_DT))/365.25)as integer) as age FROM ssap_data WHERE ' +
        getCondition(req.body.cancer_endpoint, req.body.start_of_follow_up, req.body.censoring_rules) +
        //' AND DATE_DT <= \'2017-12-31\' ' +
        ' AND NOT DATE_DT = \'\' ORDER BY year, age';

    console.log("---------------------------");
    console.log(sql);

    sequelize.query(sql)
        .then(result => {

            //console.log("------------> size = " + result[0].length);

            let data = [];
            for (var i = 0; i < result[0].length; i++) {
                data.push([result[0][i].year, result[0][i].age]);
            }

            /*
            let displayed = [];
            let data = [];
            for (var i = 0; i < result[0].length; i++) {
                //console.log("data = " + JSON.stringify(result[0][i]));
                let diag_date_str = result[0][i].DATE_DT;
                let birthday_str = result[0][i].DATE_OF_BIRTH_DT;
                let diag_date = moment(diag_date_str, 'YYYY-MM-DD');
                let birthday = moment(birthday_str, 'YYYY-MM-DD');
                let age = Math.round(diag_date.diff(birthday, 'days') / 365.25);

                if (displayed.indexOf(diag_date.year()+"_"+age) === -1) {
                    data.push([diag_date.year(), age]);
                    displayed.push(diag_date.year()+"_"+age);
                }
            }
             */
            res.json(data);
        });

});


app.post('/api/summary/tumor_histology', (req, res) => {

    let sql = "SELECT (CASE HISTOLOGIC_ICDO3_TYP WHEN '' THEN 'Unknown' ELSE HISTOLOGIC_ICDO3_TYP END) AS HISTOLOGIC_ICDO3_TYP, count(*) AS TOTAL FROM ssap_data WHERE NOT HISTOLOGIC_ICDO3_TYP='' AND  " +
        getCondition(req.body.cancer_endpoint, req.body.start_of_follow_up, req.body.censoring_rules) +
        " GROUP BY HISTOLOGIC_ICDO3_TYP";

    console.log("---------------------------");
    console.log(sql);

    sequelize.query(sql)
        .then(result => {
            //console.log("data = " + JSON.stringify(result));
            let data = [];
            for (var i = 0; i < result[0].length; i++) {
                //console.log("data = " + JSON.stringify(result[0][i]));
                let name = result[0][i].HISTOLOGIC_ICDO3_TYP;
                let y = result[0][i].TOTAL;
                data.push({name: name, y: y});
            }
            res.json(data);
        });

});

app.post('/api/summary/stage', (req, res) => {

    let sql = 'SELECT STAGE_SUM_IND, count(*) AS TOTAL FROM ssap_data WHERE ' +
        getCondition(req.body.cancer_endpoint, req.body.start_of_follow_up, req.body.censoring_rules) +
        ' GROUP BY STAGE_SUM_IND';

    console.log("---------------------------");
    console.log(sql);

    sequelize.query(sql)
        .then(result => {
            //console.log("data = " + JSON.stringify(result));
            let data = [];
            for (var i = 0; i < result[0].length; i++) {
                //console.log("data = " + JSON.stringify(result[0][i]));
                let name = result[0][i].STAGE_SUM_IND;
                switch (name) {
                    case '0':
                        name = 'In situ';
                        break;
                    case '1':
                        name = 'Localized';
                        break;
                    case '2':
                        name = 'Regional by direct extension';
                        break;
                    case '3':
                        name = 'Regional by lymph nodes';
                        break;
                    case '4':
                        name = 'Regional by direct extension and lymph nodes';
                        break;
                    case '5':
                        name = 'Regional, NOS';
                        break;
                    case '7':
                        name = 'Remote';
                        break;
                    case '8':
                        name = 'Not abstracted';
                        break;
                    case '9':
                        name = 'Unknown or not specified';
                        break;
                    default:
                        name = 'Unknown or not specified';

                }
                ;
                let y = result[0][i].TOTAL;
                data.push({
                    showInLegend: false,
                    name: name,
                    data: [y]
                });
            }
            res.json(data);
        });

});

app.delete('/api/project/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const id = req.params.id;
        Project.destroy({where: {id: id}}).then(
            project => {
                res.setHeader('Content-Type', 'application/json');
                res.send({done: true});
            }
        )
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.send({Error: 'No permission to delete this project.'});
    }
});

app.put('/api/project/:id', (req, res) => {
    if (req.session.user) {
        const id = req.params.id;
        const updates = req.body;
        Project.findOne({
            where: {id: id},
            include: [
                {model: User, as: 'users'},
            ],
        }).then(project => {
            return project.update(updates);
        }).then(updated_project => {
            if (req.body.users && req.body.users.length > 0) {
                let conditions = [];
                for (var i = 0; i < req.body.users.length; i++) {
                    conditions.push({id: req.body.users[i].id});
                }
                const {Op} = require("sequelize");
                User.findAll({
                    where: {[Op.or]: conditions}
                }).then(users => {
                    updated_project.setUsers(users);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(updated_project));
                })
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(updated_project));
            }
        });
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.send({Error: 'No permission to update this project.'});
    }
});

app.post('/api/cancer_endpoints', (req, res) => {

    let sql =
        'SELECT SITE_GROUP_NME, SEER_ID, ICD_O3_CDE, HISTOLOGIC_ICDO3_TYP, count(*) as TOTAL ' +
        '  FROM ssap_data WHERE (';
    for (var i = 0; i < req.body.search.length; i++) {
        if (i > 0) sql += ' OR ';
        sql += ' SITE_GROUP_NME=\'' + req.body.search[i] + '\' ';
    }

    if (req.body.search.length === 0) {
        sql += ' 1 = 0 ';
    }

    sql += ')';

    //AND NOT HISTOLOGIC_ICDO3_TYP=\'\'';

    if (req.body.filters && req.body.filters.ICD_O3_CDE && req.body.filters.ICD_O3_CDE.length > 0) {
        let ICD_O3_CDE_filters = req.body.filters.ICD_O3_CDE;
        sql += ' AND (';
        for (var j = 0; j < ICD_O3_CDE_filters.length; j++) {
            if (j > 0) sql += ' OR ';
            sql += ' ICD_O3_CDE=\'' + ICD_O3_CDE_filters[j] + '\'';
        }
        sql += ') ';
    }

    if (req.body.filters && req.body.filters.HISTOLOGIC_ICDO3_TYP && req.body.filters.HISTOLOGIC_ICDO3_TYP.length > 0) {
        let ICD_O3_CDE_filters = req.body.filters.HISTOLOGIC_ICDO3_TYP;
        sql += ' AND (';
        for (var j = 0; j < ICD_O3_CDE_filters.length; j++) {
            if (j > 0) sql += ' OR ';
            sql += ' HISTOLOGIC_ICDO3_TYP=\'' + ICD_O3_CDE_filters[j] + '\'';
        }
        sql += ') ';
    }

    sql += ' GROUP BY SITE_GROUP_NME, SEER_ID, ICD_O3_CDE, HISTOLOGIC_ICDO3_TYP ';

    if (req.body.sorter && req.body.sorter.order) {
        if (req.body.sorter.order === 'ascend') {
            sql += " ORDER BY TOTAL ASC, SEER_ID, ICD_O3_CDE "
        } else if (req.body.sorter.order === 'descend') {
            sql += " ORDER BY TOTAL DESC, SEER_ID, ICD_O3_CDE "
        }
    } else {
        sql += " ORDER BY SEER_ID, ICD_O3_CDE "
    }

    console.log(sql);

    sequelize.query(
        sql,
        {
            replacements: {search: req.body.search},
            type: sequelize.QueryTypes.SELECT
        })
        .then(result => {
            if (result.length > 0) {
                let total = 0;
                for (var i = 0; i < result.length; i++) {
                    //result[i].key = i;
                    total += result[i].TOTAL;
                }
                result.push({
                    SITE_GROUP_NME: 'Total Number of Cancer Records',
                    TOTAL: total
                })
            }
            res.json(result);
        });
});


app.post('/api/cancer_endpoint', (req, res) => {

    let sql =
        'SELECT SITE_GROUP_NME, SEER_ID, ICD_O3_CDE, HISTOLOGIC_ICDO3_TYP, count(*) as TOTAL ' +
        '  FROM ssap_data ' +
        ' WHERE SITE_GROUP_NME=(:search) '; //AND NOT HISTOLOGIC_ICDO3_TYP=\'\'';

    if (req.body.filters && req.body.filters.ICD_O3_CDE && req.body.filters.ICD_O3_CDE.length > 0) {
        let ICD_O3_CDE_filters = req.body.filters.ICD_O3_CDE;
        sql += ' AND (';
        for (var j = 0; j < ICD_O3_CDE_filters.length; j++) {
            if (j > 0) sql += ' OR ';
            sql += ' ICD_O3_CDE=\'' + ICD_O3_CDE_filters[j] + '\'';
        }
        sql += ') ';
    }

    if (req.body.filters && req.body.filters.HISTOLOGIC_ICDO3_TYP && req.body.filters.HISTOLOGIC_ICDO3_TYP.length > 0) {
        let ICD_O3_CDE_filters = req.body.filters.HISTOLOGIC_ICDO3_TYP;
        sql += ' AND (';
        for (var j = 0; j < ICD_O3_CDE_filters.length; j++) {
            if (j > 0) sql += ' OR ';
            sql += ' HISTOLOGIC_ICDO3_TYP=\'' + ICD_O3_CDE_filters[j] + '\'';
        }
        sql += ') ';
    }

    sql += ' GROUP BY SITE_GROUP_NME, SEER_ID, ICD_O3_CDE, HISTOLOGIC_ICDO3_TYP ';

    if (req.body.sorter && req.body.sorter.order) {
        if (req.body.sorter.order === 'ascend') {
            sql += " ORDER BY TOTAL ASC, SITE_GROUP_NME, SEER_ID, ICD_O3_CDE "
        } else if (req.body.sorter.order === 'descend') {
            sql += " ORDER BY TOTAL DESC, SITE_GROUP_NME, SEER_ID, ICD_O3_CDE "
        }
    } else {
        sql += " ORDER BY SITE_GROUP_NME, SEER_ID, ICD_O3_CDE "
    }

    sequelize.query(
        sql,
        {
            replacements: {search: req.body.search},
            type: sequelize.QueryTypes.SELECT
        })
        .then(result => {
            if (result.length > 0) {
                let total = 0;
                for (var i = 0; i < result.length; i++) {
                    //result[i].key = i;
                    total += result[i].TOTAL;
                }
                result.push({
                    SITE_GROUP_NME: 'Total Number of Cancer Records',
                    TOTAL: total
                })
            }
            res.json(result);
        });
});

app.post('/api/questionnarie', (req, res) => {

    let sql =
        "SELECT Questionnarie, Section, `Variable name`, Description, `Values` from questionnarie_metadata WHERE 1 = 1";

    //`Pre-selected variables`=1 ";

    console.log(JSON.stringify(req.body.search));

    if (req.body.search.questionnarie && req.body.search.questionnarie.length > 0) {
        sql += " AND (";
        for (var i = 0; i < req.body.search.questionnarie.length; i++) {
            if (i > 0) sql += "  OR ";
            sql += "Questionnarie='" + req.body.search.questionnarie[i] + "'";
        }
        sql += ")";

        if (req.body.search.searchTerm) {
            sql += ` AND ( Section LIKE '%${req.body.search.searchTerm}%' OR  description LIKE '%${req.body.search.searchTerm}%' ) `
        }
    } else {
        sql += " AND 1 = 0 ";
    }

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(result => {
            let data = result[0];
            let dataset = [];
            for (var i = 0; i < data.length; i++) {
                dataset.push({
                    questionnarie: data[i]['Questionnarie'],
                    section: data[i]['Section'],
                    variable: data[i]['Variable name'],
                    description: data[i]['Description'],
                    values: data[i]['Values']
                });
            }
            res.json(dataset);
        });
});

app.post('/api/questionnarie2', (req, res) => {

    let sql =
        "SELECT Questionnarie, Section, `Variable name`, Description, `Values` " +
        "  FROM questionnarie_metadata WHERE NOT Section = '' ";

    if (req.body.search.questionnarie && req.body.search.questionnarie.length > 0) {
        sql += " AND (";
        for (var i = 0; i < req.body.search.questionnarie.length; i++) {
            if (i > 0) sql += "  OR ";
            sql += "Questionnarie='" + req.body.search.questionnarie[i] + "'";
        }
        sql += ")";

        if (req.body.search.searchTerm) {
            sql += ` AND ( Section LIKE '%${req.body.search.searchTerm}%' OR  description LIKE '%${req.body.search.searchTerm}%' ) `
        }
    } else {
        sql += " AND 1 = 0 ";
    }

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(result => {
            let data = result[0];
            let dataset = [];
            let current_section = null;
            for (var i = 0; i < data.length; i++) {

                if (data[i]['Section'] !== current_section) {
                    dataset.push({
                        questionnarie: data[i]['Questionnarie'],
                        section: data[i]['Section'],
                        variable: data[i]['Section'],
                        description: data[i]['Section'],
                    });

                    current_section = data[i]['Section'];
                }

                if (req.body.search.expends && req.body.search.expends[data[i]['Section']] === true) {
                    dataset.push({
                        questionnarie: data[i]['Questionnarie'],
                        section: data[i]['Section'],
                        variable: data[i]['Variable name'],
                        description: data[i]['Description'],
                        values: data[i]['Values']
                    });
                }
            }
            res.json(dataset);
        });
});

app.post('/api/topic', (req, res) => {

    let sql =
        "SELECT Questionnarie, topic_name, `Variable`, Description, `Values` " +
        "  FROM topic WHERE NOT topic_name = '' ";

    if (req.body.search.questionnarie && req.body.search.questionnarie.length > 0) {
        if (req.body.search.questionnarie.length !== 8) {
            sql += " AND (";
            for (var i = 0; i < req.body.search.questionnarie.length; i++) {
                if (i > 0) sql += "  OR ";
                sql += "Questionnarie='" + req.body.search.questionnarie[i] + "'";
            }
            sql += ")";
        }

        if (req.body.search.searchTerm) {
            sql += ` AND ( topic_name LIKE '%${req.body.search.searchTerm}%' OR  description LIKE '%${req.body.search.searchTerm}%' ) `
        }
    } else {
        sql += " AND 1 = 0 ";
    }

    sql += " ORDER BY topic_name, Questionnarie ";

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(result => {
            let data = result[0];
            let dataset = [];
            let current_section = null;
            for (var i = 0; i < data.length; i++) {
                if (data[i]['topic_name'] !== current_section) {
                    dataset.push({
                        questionnarie: data[i]['questionnarie'],
                        section: data[i]['topic_name'],
                        variable: data[i]['topic_name'],
                        description: data[i]['topic_name'],
                    });
                    current_section = data[i]['topic_name'];
                }

                if (req.body.search.expends && req.body.search.expends[data[i]['topic_name']] === true) {
                    dataset.push({
                        questionnarie: data[i]['questionnarie'],
                        section: data[i]['topic_name'],
                        variable: data[i]['Variable'],
                        description: data[i]['Description'],
                        values: data[i]['Values']
                    });
                }
            }

            res.json(dataset);
        });
});

app.post('/api/topic_variable', (req, res) => {

    let sql =
        "SELECT Questionnarie, topic_name, `Variable` " +
        "  FROM topic WHERE NOT topic_name = '' ";

    if (req.body.search.questionnarie && req.body.search.questionnarie.length > 0) {
        sql += " AND (";
        for (var i = 0; i < req.body.search.questionnarie.length; i++) {
            if (i > 0) sql += "  OR ";
            sql += "Questionnarie='" + req.body.search.questionnarie[i] + "'";
        }
        sql += ")";

        if (req.body.search.searchTerm) {
            sql += ` AND ( topic_name LIKE '%${req.body.search.searchTerm}%' OR  description LIKE '%${req.body.search.searchTerm}%' ) `
        }
    } else {
        sql += " AND 1 = 0 ";
    }

    sql += " ORDER BY topic_name ";

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(result => {
            let data = result[0];
            let dataset = [];
            let current_section = null;
            for (var i = 0; i < data.length; i++) {
                dataset.push({
                    questionnarie: data[i]['questionnarie'],
                    section: data[i]['topic_name'],
                    variable: data[i]['Variable'],
                });
            }
            res.json(dataset);
        });
});


app.post('/api/topic_for_original_design', (req, res) => {

    let sql =
        "SELECT Questionnarie, topic_name, `Variable`, Description, `Values`, section " +
        "  FROM topic WHERE NOT topic_name = '' ";

    if (req.body.search.questionnarie && req.body.search.questionnarie.length > 0) {
        if (req.body.search.questionnarie.length !== 8) {
            sql += " AND (";
            for (var i = 0; i < req.body.search.questionnarie.length; i++) {
                if (i > 0) sql += "  OR ";
                sql += "Questionnarie='" + req.body.search.questionnarie[i] + "'";
            }
            sql += ")";
        }

        if (req.body.search.searchTerm) {
            sql += ` AND ( topic_name LIKE '%${req.body.search.searchTerm}%' OR  description LIKE '%${req.body.search.searchTerm}%' ) `
        }

        if (req.body.search.topics && req.body.search.topics.length > 0) {
            sql += ' AND (';
            for (var i = 0; i < req.body.search.topics.length; i++) {
                if (i > 0) sql += "  OR ";
                sql += ` topic_name ='${req.body.search.topics[i]}' `;
            }
            sql += " ) ";
        } else if (!req.body.search.searchTerm) {
            sql += " AND 1 = 0 ";
        }
    } else {
        sql += " AND 1 = 0 ";
    }

    sql += " ORDER BY topic_name, Questionnarie ";

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(result => {
            let data = result[0];
            let dataset = [];
            for (var i = 0; i < data.length; i++) {
                dataset.push({
                    questionnarie: data[i]['questionnarie'],
                    topic: data[i]['topic_name'],
                    variable: data[i]['Variable'],
                    description: data[i]['Description'],
                    values: data[i]['Values'],
                    section: data[i]['section']
                });
            }

            res.json(dataset);
        });
});


app.listen(3001, () =>
    console.log('Express server is running on localhost:3001')
);
