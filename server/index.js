const express = require('express');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const pino = require('express-pino-logger')();
const path = require('path');
const moment = require('moment');

const getCondition = require('./query_condition');
const {
    getCaseIndicator,
    getCoditionForCancerEndpoint,
    getAnalysisStartDate,
    getEndOfFollowupDate,
    getDataGenerationCondition,
    getPrevalent
} = require('./data_generation_condition');

/* ---------------------------------
   setup database
-----------------------------------*/

const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './cts.sqlite',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
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

/*
const users = require('../src/model/users');
const init = () => {
    for (var i = 0; i < users.length; i++) {
        //console.log(JSON.stringify(users[i]));
        User.create(users[i]);
    }
}
 */

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
        //console.log("------------------------------");
        //console.log(JSON.stringify(user.projects));
    })
    .then(() => Project.findOne({
        where: {id: 1},
        include: [{model: User, as: 'users'}]
    }))
    .then(project => {
        //console.log("------------------------------");
        //console.log(JSON.stringify(project.users));
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

app.get('/api/ping', (req, res) => {
    if (req.session.user) {
        let user = {...req.session.user};
        user.password = undefined;
        res.json(user);
    } else {
        res.json({});
    }
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

app.post('/api/project/search', (req, res) => {

    if (req.session.user && req.session.user.role === 'admin') {
        let searchTerm = req.body.searchTerm;

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
                let output_projects = [];
                for (var j = 0; j < projects.length; j++) {
                    for (var i = 0; i < projects[j].users.length; i++) {
                        projects[j].users[i].password = undefined;
                    }

                    if (searchTerm) {
                        if (projects[j].name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                            output_projects.push(projects[j]);
                        } else if (projects[j].abbrev.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                            output_projects.push(projects[j]);
                        } else if (projects[j].study_design.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                            output_projects.push(projects[j]);
                        } else if (projects[j].endpoint.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                            output_projects.push(projects[j]);
                        } else {
                            for (var i = 0; i < projects[j].users.length; i++) {
                                if (projects[j].users[i].first_name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                                    output_projects.push(projects[j]);
                                    break;
                                } else if (projects[j].users[i].last_name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                                    output_projects.push(projects[j]);
                                    break;
                                } else if (projects[j].users[i].email.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                                    output_projects.push(projects[j]);
                                    break;
                                }
                            }
                        }
                    } else {
                        output_projects.push(projects[j]);
                    }

                }
                res.setHeader('Content-Type', 'application/json');
                res.json(output_projects);
            })
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.json({Error: 'No permission to search projects'});
    }
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
                "age_mom_atbirth": true,
                "age_dad_atbirth": true,
                "menarche_age": true,
                "oralcntr_ever_q1": true,
                "oralcntr_yrs": true,
                "fullterm_age1st": true,
                "preg_ever_q1": true,
                "preg_total_q1": true,
                "meno_stattype": true,
                "height_q1": true,
                "weight_q1": true,
                "bmi_q1": true,
                "diab_self_q1": true,
                "hbp_self_q1": true,
                "allex_hrs_q1": true,
                "allex_life_hrs": true,
                "vit_mulvit_q1": true,
                "alchl_analyscat": true,
                "smoke_expocat": true,
                "smoke_totyrs": true,
                "smoke_totpackyrs": true,
                "cig_day_avg": true,
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

    let sql = 'SELECT count(DISTINCT SSAP_ID) as TOTAL FROM ssap_data_2 WHERE ' +
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

    let sql = 'SELECT DISTINCT cast(strftime(\'%Y\', date(DATE_DT))as integer) as year,  ' +
        ' cast(round((julianday(DATE_DT)-julianday(DATE_OF_BIRTH_DT))/365.25)as integer) as age FROM ssap_data_2 WHERE ' +
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

    let sql = "SELECT (CASE HISTOLOGIC_ICDO3_TYP WHEN '' THEN 'Unknown' ELSE HISTOLOGIC_ICDO3_TYP END) AS HISTOLOGIC_ICDO3_TYP, count(*) AS TOTAL FROM ssap_data_2 WHERE NOT HISTOLOGIC_ICDO3_TYP='' AND  " +
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

    let sql = 'SELECT STAGE_SUM_IND AS STAGE_SUM_IND, count(*) AS TOTAL FROM ssap_data_2 WHERE ' +
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
        'SELECT SITE_GROUP_NME AS SITE_GROUP_NME, SEER_ID AS SEER_ID, ICD_O3_CDE AS ICD_O3_CDE, HISTOLOGIC_ICDO3_TYP AS HISTOLOGIC_ICDO3_TYP, count(*) as TOTAL ' +
        '  FROM ssap_data_2 WHERE (';
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
        'SELECT SITE_GROUP_NME AS SITE_GROUP_NME, SEER_ID AS SEER_ID, ICD_O3_CDE AS ICD_O3_CDE, HISTOLOGIC_ICDO3_TYP AS HISTOLOGIC_ICDO3_TYP, count(*) as TOTAL ' +
        '  FROM ssap_data_2 ' +
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
        "SELECT Questionnarie, Section, `Variable name`, Description, `Values` from questionnarie_metadata_2 WHERE 1 = 1";

    //`Pre-selected variables`=1 ";

    //console.log(JSON.stringify(req.body.search));

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
        "  FROM questionnarie_metadata_2 WHERE NOT Section = '' ";

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
        "  FROM topic_2 WHERE NOT topic_name = '' ";

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
        "  FROM topic_2 WHERE NOT topic_name = '' ";

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



app.post('/api/topic_search', (req, res) => {

    let sql =
        "SELECT DISTINCT topic_name FROM topic_2 WHERE NOT topic_name = '' ";

    if (req.body.searchTerm) {
        sql += ` AND ( topic_name LIKE '%${req.body.searchTerm}%' OR  description LIKE '%${req.body.searchTerm}%' ) `
    }

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(topics => {
            console.log("\n\n\n--------------------------");
            console.log(JSON.stringify(topics, null, 2));
            let result = [];
            for (var i=0; i<topics[0].length; i++) {
                result.push(topics[0][i].topic_name);
            }
            console.log("------------");
            console.log(result)
            res.json(result);
        });

});

app.post('/api/topic_for_original_design', (req, res) => {

    let sql =
        "SELECT Questionnarie, topic_name, `Variable`, Description, `Values`, section " +
        "  FROM topic_2 WHERE NOT topic_name = '' ";

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

//const Database = require('better-sqlite3');
const {Parser} = require('json2csv');

/*
let sql2 = "SELECT topic_name, questionnarie, variable as variable FROM topic_2 ";
const db2 = new Database('cts.sqlite', {verbose: console.log});
const stmt2 = db2.prepare(sql2);
const rows2 = stmt2.all();
let topic_to_variable = {};
for (var i = 0; i < rows2.length; i++) {
    console.log("======> " + rows2[i].topic_name+"  "+rows2[i].questionnarie + "   " + rows2[i].variable);
    console.log("        " + JSON.stringify(rows2[i]));

    if (topic_to_variable[rows2[i].topic_name] === undefined) {
        topic_to_variable[rows2[i].topic_name] = [];
    }

    topic_to_variable[rows2[i].topic_name].push({
        "variable": rows2[i].variable, "questionnarie": rows2[i].questionnarie
    })
}

console.log("================================");
console.log(JSON.stringify(topic_to_variable));
console.log("================================");
*/

/*
let get_all_columns = () => {
    let sql = "PRAGMA table_info(ssap_data_2)";
    const db = new Database('cts.sqlite', {verbose: console.log});
    const stmt = db.prepare(sql);
    const rows = stmt.all();
    let all_columns = [];
    for (var i = 0; i < rows.length; i++) {
        all_columns.push(rows[i].name);
    }

    return all_columns;
}

let get_questionnarie_columns = () => {
    let sql = "select `Variable Name` as variable from questionnarie_metadata_2";
    const db = new Database('cts.sqlite', {verbose: console.log});
    const stmt = db.prepare(sql);
    const rows = stmt.all();

    let all_columns = [];
    for (var i = 0; i < rows.length; i++) {
        all_columns.push(rows[i].variable);
    }
    return all_columns;
}
 */

//let all_columns = get_all_columns();
let all_columns =
    ["ssap_id", "date_of_birth_dt", "date_of_death_dt", "cause_of_death_cde", "cause_of_death_dsc", "qnr_1_fill_dt", "qnr_2_fill_dt", "qnr_3_fill_dt", "qnr_4_fill_dt", "qnr_4_mini_fill_dt", "qnr_5_fill_dt", "qnr_5_mini_fill_dt", "qnr_6_fill_dt", "breast_cancer_res_only_ind", "ses_quartile_ind", "blockgroup90_urban_cat", "hysterectomy_dt", "hysterectomy_ind", "bilateral_mastectomy_dt", "bilateral_mastectomy_ind", "bilateral_oophorectomy_dt", "bilateral_oophorectomy_ind", "first_moveout_ca_dt", "date_dt", "seer_id", "site_sub_cat1_nme", "site_group_nme", "histologic_icdo2_typ", "histologic_icdo3_typ", "icd_o3_cde", "tumor_grade_id", "stage_cde", "stage_behaviour_ind", "stage_behaviour_nme", "stage_sum_ind", "stage_seer_cde", "cancer_confirm_ind", "lag_birth_day_qty", "lag_death_day_qty", "lag_from_first_event_day_qty", "lag_from_qnr1_day_qty", "lag_from_qnr2_day_qty", "lag_from_qnr3_day_qty", "lag_from_qnr3m_day_qty", "lag_from_qnr4_day_qty", "lag_from_qnr4m_day_qty", "lag_from_qnr5_day_qty", "lag_from_qnr5m_day_qty", "lag_from_qnr6_day_qty", "lymph_node_pos_nbr_cde", "tumor_multi_asone_primary_cde", "tumor_multi_count_cde", "chemo_sum_cde", "horm_sum_cde", "immuno_sum_cde", "other_sum_cde", "rad_sum_cde", "norad_reason_cde", "nosurg_reason_cde", "rad_seq_cde", "rx_dt", "rx_nodate_cde", "rx_chemo_dt", "rx_chemo_nodate_cde", "rx_horm_dt", "rx_horm_nodate_cde", "rx_immuno_dt", "rx_immuno_nodate_cde", "rx_other_dt", "rx_other_nodate_cde", "rad_boost_mode_cde", "rad_regional_mode_cde", "rx_rad_dt", "rx_rad_nodate_cde", "rx_stg_proc_dt", "rx_stg_proc_nodate_cde", "rx_systemic_dt", "rx_systemic_nodate_cde", "rx_systemic_sum_seq_cde", "nnodes_cde", "surg_sum_cde", "surg_other_cde", "surg_primary_cde", "surg_recon_cde", "surg_dt", "surg_nodate_cde", "surg_defin_dt", "surg_defin_nodate_cde", "surg_other_98_cde", "surg_primary_98_cde", "scope_ind", "scope1_cde", "scope2_cde", "scope3_cde", "surg1_dt", "surg1_other_cde", "surg1_primary_cde", "surg2_dt", "surg2_other_cde", "surg2_primary_cde", "surg3_dt", "surg3_other_cde", "surg3_primary_cde", "transp_dt", "transp_nodate_cde", "lateral_site_cde", "estrogen_rcptr_ind", "estrogen_rcptr_dsc", "progesterone_rcptr_ind", "progesterone_rcptr_dsc", "her2_rcptr_ind", "her2_rcptr_dsc", "age_at_baseline", "adopted", "twin", "birthplace", "birthplace_mom", "birthplace_dad", "participant_race", "dad_race", "mom_race", "nih_ethnic_cat", "nih_race_cat", "nih_hisp_enroll", "age_mom_atbirth", "age_dad_atbirth", "older_bros_num", "older_sis_num", "younger_bros_num", "younger_sis_num", "employ_currschl", "employ_longschl", "teacher_type", "employ_numschl", "employ_schlyrs", "near_chemplnt", "near_powerplnt", "near_pulpmill", "near_oilrefine", "near_landfill", "powerln_currschl", "powerln_longschl", "powerln_currres", "powerln_longres", "pstcideskn_undr15", "pstcideskn15_35", "pstcideskn_ovr35", "pstcidehm_undr15", "pstcidehm15_35", "pstcidehm_ovr35", "pstcidecloud_undr15", "pstcidecloud15_35", "pstcidecloud_ovr35", "pstcidefarm_undr15", "pstcidefarm15_35", "pstcidefarm_ovr35", "elecblnket", "elecwatrbed", "elecrmheat", "eleclight", "sunskn_noprotec", "sunskn_repeat", "sunbrnblist", "sunbrnblist_age", "sunbrnblist_num", "menarche_age", "period_timetoreg", "period_daysbtwn", "oralcntr_ever_q1", "oralcntr_yrs", "bc_1stage", "bc_lastage", "fullterm_age1st", "preg_age1st", "livbirth_total", "stilbirth_total", "miscarr_total", "abort_total", "tubalpreg_total", "fullterm_total", "preg_ever_q1", "preg_curr_q1", "miscarr_age1st", "abort_age1st", "preg_agelast", "preg_total_q1", "livbirth_age1st", "breastfd_age1st", "breastfd_mo", "des_stopmiscarr", "preg_failed", "fertdrug_clomid", "fertdrug_danazol", "fertdrug_danocrn", "fertdrug_hcg", "fertdrug_milophn", "fertdrug_lupron", "fertdrug_nolvadx", "fertdrug_pergonl", "fertdrug_serophn", "fertdrug_synarel", "fertdrug_other", "fertdrug_none", "period_stop", "meno_statbasic", "meno_stattype", "meno_stattype_age", "agelastperiod_q1", "whyperiodstop_q1", "hysterectomy_age_q1", "ovaryremoved_q1", "ovaryremoved_age_q1", "tuballig_age_q1", "estroalone", "eplusp", "progalone", "ht_revusepattern", "ht_allpast_curr", "estroalone_dur", "progalone_dur", "eplusp_dur", "estroalone_start", "progalone_start", "eplusp_start", "estroalone_end", "progalone_end", "eplusp_end", "premarn_age1st", "premarn_agelast", "premarn_totyrs", "premarn_grn_q1", "premarn_brwn_q1", "premarn_wht_q1", "premarn_yelorn_q1", "premarn_prpl_q1", "premarn_longest", "estro_mouth", "estro_inject", "estro_patch_impl", "estro_vag", "prog_ever", "meno_ht_statcomb", "prog_age1st", "prog_agelast", "prog_totyrs", "prog_days_mo_q1", "provera_dose_q1", "brca", "brca_age1st", "brimplant", "brimplant_age1st", "brimplant_type", "mammo_ever_q1", "brexam", "papsmr", "mammo_yrssnce_ques62", "brexam_yrssnce_ques62", "papsmr_yrssnce_ques62", "brexam_lastyr", "bldtrans_never", "bldtrans_undr35", "bldtrans35_44", "bldtrans45_54", "bldtrans55_64", "bldtrans_ovr64", "height_q1", "weight_q1", "height_age18", "weight_age18", "bmi_q1", "bmi_age18", "aspr_totyrs", "aspr_days_wk", "acetm_totyrs", "acetm_days_wk", "ibupf_totyrs", "ibupf_days_wk", "tagam_totyrs", "tagam_days_wk", "resprn_totyrs", "resprn_days_wk", "wtrpil_totyrs", "wtrpil_days_wk", "hbpmed_totyrs", "hbpmed_days_wk", "calcium_totyrs", "calcium_days_wk", "nsaid_totyrs", "nsaid_days", "brca_self_ovr50_q1", "brca_self_undr50_q1", "endoca_self_q1", "cervca_self_q1", "ovryca_self_q1", "lungca_self_q1", "leuk_self_q1", "hodg_self_q1", "colnca_self_q1", "thyrca_self_q1", "meln_self_q1", "nevrca_self_q1", "nevrca_mom_q1", "nevrca_dad_q1", "gallstn_self", "diab_self_q1", "hipfrac_self", "fibroid_self", "endomtrs_self", "migrain_self", "brstbiop_self", "colnpoly_self", "thyrdis_self", "molesrmv_self", "stroke_self_q1", "hrtatk_self_q1", "hbp_self_q1", "brca_selfsurvey", "brca_famhis", "endoca_famhis", "ovryca_famhis", "cervca_famhis", "lungca_famhis", "leuk_famhis", "hodg_famhis", "thyrca_famhis", "colnca_famhis", "meln_famhis", "prosca_famhis", "strnex_hs_hrs", "strnex18_24hrs", "strnex25_34hrs", "strnex35_44hrs", "strnex45_54hrs", "strnex_hrs_q1", "modex_hs_hrs", "modex18_24hrs", "modex25_34hrs", "modex35_44hrs", "modex45_54hrs", "modex_hrs_q1", "strnex_life_hrs", "modex_life_hrs", "allex_hs_hrs", "allex18_24hrs", "allex25_34hrs", "allex35_44hrs", "allex45_54hrs", "allex_hrs_q1", "allex_life_hrs", "strnex_fix_q1", "modex_fix_q1", "caswalk_hrs", "caswalk_days", "housewrk_hrs", "housewrk_days", "stand_hrs", "stand_days", "sit_hrs", "sit_days", "sleep_hrs", "sleep_days", "vit_reg_no", "mulvit_days", "mulvit_yrs_q1", "vita_days_q1", "vita_yrs_q1", "bcar_days", "bcar_yrs", "vitc_days_q1", "vitc_yrs_q1", "vite_days_q1", "vite_yrs_q1", "selen_days", "selen_yrs", "daily_fiber", "daily_prot", "daily_fat", "daily_calcium", "daily_sfat", "daily_oleic", "daily_lino", "daily_chol", "daily_folate", "perccal_fat", "totdiet_caroten", "totdaily_kcal", "totdaily_carb", "glyc_avgdaily", "glyc_avgtot", "diet_plant", "diet_highprotfat", "diet_highcarb", "dief_ethnic", "diet_saladwine", "vit_mulvit_q1", "mulvit_perwk", "vit_perwk", "mulvit_dur_yrs", "vita_bcar_amt", "vita_amt", "bcar_amt", "vitc_amt", "vite_amt", "selen_amt", "serv_fats_q1", "serv_vegs_q1", "serv_fruit_q1", "serv_cere_q1", "serv_milk_q1", "lo_cheese_q1", "lo_icecrm_q1", "lo_dressn_q1", "lo_cake_q1", "addsalt_q1", "chickn_skn_q1", "meatfat_q1", "meat_charbroil_q1", "meat_cooked_q1", "alchl_g_day18_22", "alchl_g_day30_35", "alchl_g_dayrecen", "beer_g_day18_22", "wine_g_day18_22", "liqu_g_day18_22", "beer_g_day30_35", "wine_g_day30_35", "liqu_g_day30_35", "beer_g_dayrecen", "wine_g_dayrecen", "liqu_g_dayrecen", "alchl_analyselig", "alchl_analyscat", "smoke_lifeexpo", "smoke_group", "life_exposure_smk", "smoke_statcat", "smoke_expocat", "passmok_expocat", "cig_age1st", "cig_agelast", "smoke_totyrs", "smoke_totpackyrs", "smoke_yrs_quit", "smokeb4preg_yrs", "smokeafpreg_yrs", "smoke_1stpreg", "cig_day_avg", "shsmok_child", "shsmok_adult", "shsmok_child_hm", "shsmok_adult_hm", "shsmok_child_wrk", "shsmok_adult_wrk", "shsmok_child_oth", "shsmok_adult_oth", "shsmok_any", "shsmok_any_hm", "shsmok_any_wrk", "shsmok_any_oth", "shsmok_any_yrs", "shsmok_adult_yrs", "shsmok_child_yrs", "shsmok_any_sev", "shsmok_adult_sev", "shsmok_child_sev", "shsmok_any_int", "shsmok_adult_int", "shsmok_child_int", "preg_total_q2", "preg_snceq1_no", "preg_snceq1_live", "preg_snceq1_miss", "preg_snceq1_abor", "preg_snceq1_ecto", "preg_snceq1_stil", "preg_snceq1_curr", "preg_nausea_num", "preg_nausea_trt", "preg_recen_trt", "preeclamp_all", "preeclamp_recen", "mammo_ovr20", "xrayribs_undr20", "xrayribs_ovr20", "xrayback_undr20", "xrayback_ovr20", "xraychest_undr20", "xraychest_ovr20", "xraygi_undr20", "xraygi_ovr20", "xrayspine_undr20", "xrayspine_ovr20", "xraykidny_undr20", "xraykidny_ovr20", "fluorosco_undr20", "fluorosco_ovr20", "ctscan_undr20", "ctscan_ovr20", "radiat_th_undr20", "butt_avg_q2", "waist_avg_q2", "waisthip_ratio_q2", "waisthip_elig", "employ_fultch_q3", "employ_prttch_q3", "employ_fulschl_q3", "employ_prtschl_q3", "employ_fuloth_q3", "employ_prtoth_q3", "employ_self_q3", "employ_retired_q3", "employ_none_q3", "employ_homemak_q3", "employ_disabl_q3", "lastjob_yrssnce", "currjob_learning", "currjob_repetitv", "currjob_creative", "currjob_decision", "currjob_highskil", "currjob_lowfree", "currjob_varied", "currjob_lotofsay", "currjob_develop", "currjob_workfast", "currjob_workhard", "currjob_physical", "currjob_notexces", "currjob_givntime", "currjob_secure", "currjob_feelsafe", "currjob_noconfli", "currjob_competnt", "currjob_interest", "currjob_friendly", "currjob_helpful", "currjob_concern", "currjob_attentiv", "currjob_supvhelp", "currjob_supvppl", "jobabsent_times", "soc_relativ_num", "soc_friend_num", "soc_see_num", "soc_talk_num", "soc_relig_times", "soc_othgrp_times", "househld_num", "househld_kid_num", "marital_status_q3", "care_partner", "care_family", "care_friends", "undrstnd_partner", "undrstnd_family", "undrstnd_friends", "rely_partner", "rely_family", "rely_friends", "open_partner", "open_family", "open_friends", "demand_partner", "demand_family", "demand_friends", "crit_partner", "crit_family", "crit_friends", "letdown_partner", "letdown_family", "letdown_friends", "annoy_partner", "annoy_family", "annoy_friends", "feel_top", "feel_unhappy", "feel_bored", "feel_excited", "feel_hardbeclose", "feel_restless", "feel_leftout_q3", "feel_upsetcrit", "feel_lonely", "feel_compliment", "feel_keepdistant", "feel_goingmyway", "feel_accomplish", "happy", "oralcntr_ever_q3", "oralcntr_usebyq3", "oralcntr_mo", "period_nostop", "whyperiodstop_q3", "period_stopyear", "hormo_meno", "hormo_mo", "hormo_lastmo", "htcomb_4yrs_no", "htcomb_4yrs_ppro", "htcomb_4yrs_ppha", "htcomb_4yrs_oth", "estro_last4yrs", "prog_last4yrs", "estro_days_mo", "prog_days_mo_q3", "htcomb_4yrs", "asthma_q3", "asthma_age_q3", "asthma_diag_age", "asthmasym_not_q3", "asthmasym_mild_q3", "asthmasym_meds_q3", "asthmasym_doc_q3", "asthmasym_hosp_q3", "asthmasym_nmild", "asthmasym_ymild", "asthma_severity", "insulin_daily", "oralhyp_daily", "diuret_daily", "lasix_daily", "calciumblck_daily", "aceinhb_daily", "othhbp_daily", "tagam_daily", "h2blck_daily", "tamox_daily", "ralox_daily", "steroid_daily", "brondil_daily", "cholmed_daily", "antidep_daily", "lr_handed", "currres_yrs", "calires_yrs", "bdrmppl_6mo", "bdrmppl_age3", "bdrmppl_age5", "bdrmppl_age12", "bdrmppl_age30", "bdrmppl_now", "daycare_6mo", "daycare_age3", "daycare_age5", "pet_6mo", "pet_age3", "pet_age5", "pet_age12", "pet_age30", "pet_now", "hoofanm_6mo", "hoofanm_age3", "hoofanm_age5", "hoofanm_age12", "hoofanm_age30", "hoofanm_now", "hmrent_6mo", "hmrent_age3", "hmrent_age5", "hmrent_age12", "hmrent_age30", "hmrent_now", "ruralurb_6mo", "ruralurb_age3", "ruralurb_age5", "ruralurb_age12", "ruralurb_age30", "ruralurb_now", "bbaspr_perwk_q4", "aspr_perwk_q4", "ibupf_perwk_q4", "nsaid_perwk_q4", "cox2_perwk_q4", "actem_perwk_q4", "stopbbaspr", "stopaspr", "stopibupf", "stopnsaid", "stopcox2", "stopacetm", "stopbbaspr_impr", "stopaspr_impr", "stopibupf_impr", "stopnsaid_impr", "stopcox2_impr", "stopacetm_impr", "stopbbaspr_dnwrk", "stopaspr_dnwrk", "stopibupf_dnwrk", "stopnsaid_dnwrk", "stopcox2_dnwrk", "stopacetm_dnwrk", "stopbbaspr_side", "stopaspr_side", "stopibupf_side", "stopnsaid_side", "stopcox2_side", "stopacetm_side", "stopbbaspr_hear", "stopaspr_hear", "stopibupf_hear", "stopnsaid_hear", "stopcox2_hear", "stopacetm_hear", "stopbbaspr_unav", "stopaspr_unav", "stopibupf_unav", "stopnsaid_unav", "stopcox2_unav", "stopacetm_unav", "stopbbaspr_oth", "stopaspr_oth", "stopibupf_oth", "stopnsaid_oth", "stopcox2_oth", "stopacetm_oth", "statin_q4", "steroidpil_q4", "steroid_inh_q4", "othanti_inh_q4", "oral_anti_q4", "brondil_inh_q4", "brondil_linh_q4", "abio_wks_q4", "ralox_tamox_ever", "ralox_mo", "tamox_mo", "ralox_tamox_q4", "otcount_hormprep", "otcount_soyestro", "otcount_dongquai", "otcount_natprog", "otcount_blkcoho", "otcount_flaxseed", "menstrual_status_q4", "postmeno", "agelastperiod_q4", "ht_last5yrs", "ht_last5yrs_mo", "ht_ppro_offwht", "ht_ppro_gold", "ht_ppro_peach", "ht_ppro_blue", "ht_ppro_unknwn", "ht_ppha", "ht_combiptch", "ht_femhrt", "ht_estratest", "ht_othcom", "ht_nocom", "premarn_grn_q4", "premarn_blue_q4", "premarn_maroon_q4", "premarn_wht_q4", "premarn_orn_q4", "premarn_unknwn_q4", "ht_estrace", "ht_ogen", "ht_othorale", "ht_no_orale", "ht_estropatch", "ht_estrovag", "ht_no_othestro", "provera_2_5mg_q4", "provera_5_9mg_q4", "provera_10mg_q4", "provera_ovr10mg_q4", "provera_dk_q4", "ht_progestin_oth", "ht_noprog_oral", "ht_orale_days_mo", "ht_oralp_days_mo", "ht_q4", "diab_pre_q4", "diab_gest_q4", "diab_1_2_q4", "diab_pre_age_q4", "diab_gest_age_q4", "diab_1_2_age_q4", "diab_insulin", "diab_insulin_yrs", "diab_oralhyp", "diab_oralhyp_yrs", "asthma_diag_q4", "asthma_age_q4", "asthma_diagyr_q4", "asthmasym_freq_q4", "asthmasym_not_q4", "asthmasym_mild_q4", "asthmasym_meds_q4", "asthmasym_doc_q4", "asthmasym_hosp_q4", "pneu_ever", "hayfever_ever", "parkins_ever_q4", "parkins_age_q4_raw", "moonucl_ever", "endomtrs_ever", "mastitis_ever", "strnex_hrs_q4", "strnex_mo_q4", "strnex_avg_q4", "allex_avg_q4", "modex_hrs_q4", "modex_mo_q4", "modex_avg_q4", "stairs_perday", "limitd_vigact_q4", "limitd_modact_q4", "limitd_stairs_q4", "limitd_1stair_q4", "limitd_wlkmile_q4", "limitd_wlkblcks_q4", "limitd_wlk1blck_q4", "limitd_carrying_q4", "limitd_bending_q4", "limitd_bathing_q4", "weight_q4", "bmi_q4", "lost20lb_times", "gain20lb_times", "bodyb50", "bodya50", "self_sex", "diet_analyselig", "serv_vegs_q4", "serv_fruit_q4", "serv_cere_q4", "lo_cheese_q4", "lo_yogurt_q4", "lo_dressn_q4", "lo_icecrm_q4", "lo_cake_q4", "addsugar_q4", "addbutr_veg_q4", "addmarg_veg_q4", "addbutr_brd_q4", "addmarg_brd_q4", "meatfat_q4", "chickn_skn_q4", "mulvit_reg", "vita_reg", "vitc_reg", "vite_reg", "calcium_reg", "mulvit_freq", "mulvit_yrs_q4", "vita_freq", "vita_yrs_q4", "vitc_freq", "vitc_yrs_q4", "vite_freq", "vite_yrs_q4", "calcium_freq", "calcium_yrs_q4", "mulvit_miner", "mulvit_antiox", "vitc_mg", "vite_mg", "preg_ever_q4", "smokeb4preg_cig", "smokedurpreg_cig", "smokeb4preg_no", "smokedurpreg_no", "smokeb4preg_hm", "smokedurpreg_hm", "smokeb4preg_wrk", "smokedurpreg_wrk", "smokeb4preg_oth", "smokedurpreg_oth", "livbirth_1stpreg", "livbirth_ever", "smokeb4livb_cig", "smokedurlivb_cig", "smokeb4livb_no", "smokedurlivb_no", "smokeb4livb_hm", "smokedurlivb_hm", "smokeb4livb_wrk", "smokedurlivb_wrk", "smokeb4livb_oth", "smokedurlivb_oth", "hlthinsur_mdcare", "hlthinsur_comb", "retired_q4", "retired_spous", "edu_self", "edu_self_comb", "edu_spous", "edu_spous_comb", "edu_mom", "edu_mom_comb", "edu_dad", "edu_dad_comb", "household_income_q4", "ppl_support_house_income_q4", "minor_support_house_inc_q4", "senior_support_house_inc_q4", "menstrual_status_q4mini", "postmeno_mini", "agelastperiod_q4mini", "ht_last5yrs_mini", "ht_last5yrs_mo_mini", "ht_ppro_offwht_mini", "ht_ppro_gold_mini", "ht_ppro_peach_mini", "ht_ppro_blue_mini", "ht_ppro_unknwn_mini", "ht_ppha_mini", "ht_combiptch_mini", "ht_femhrt_mini", "ht_estratest_mini", "ht_othcom_mini", "ht_nocom_mini", "premarn_grn_q4mini", "premarn_blue_q4mini", "premarn_maroon_q4mini", "premarn_wht_q4mini", "premarn_orn_q4mini", "premarn_unknwn_q4mini", "ht_estrace_mini", "ht_ogen_mini", "ht_othorale_mini", "ht_no_orale_mini", "ht_estropatch_mini", "ht_estrovag_mini", "ht_no_othestro_mini", "provera_2_5mg_q4mini", "provera_5_9mg_q4mini", "provera_10mg_q4mini", "provera_ovr10mg_q4mini", "provera_dk_q4mini", "ht_progestin_oth_mini", "ht_noprog_oral_mini", "ht_orale_days_mo_mini", "ht_oralp_days_mo_mini", "ht_q4mini", "ralox_ever_mini", "ralox_mo_mini", "ralox_q4mini", "otcount_hormprep_mini", "otcount_soyestro_mini", "otcount_dongquai_mini", "otcount_natprog_mini", "otcount_blkcoho_mini", "otcount_flaxseed_mini", "weight_q4mini", "marital_status_q5", "employ_schl_q5", "employ_oth_q5", "employ_return_q5", "employ_unable_q5", "employ_homemak_q5", "employ_retired_q5", "sleep_quality", "sleep_fall", "sleep_hrs_night", "sleep_trouble", "sleep_reg_lastyr", "sleep_reg2_5yrs", "sleep_reg6_10yrs", "sleep_reg_ovr11yrs", "sleep_med_howoft", "sleep_type_teen", "sleep_type30_40", "sleep_type_now", "colds_howoft", "hrswithchildren", "stand_wrk_hrs", "stand_hm_hrs", "sit_wrk_hrs", "sit_car_hrs", "sit_tv_hrs", "sit_read_hrs", "sit_oth_hrs", "lightex_hrs", "walk_hrs", "weighttrain_hrs", "walk_normalpace", "strnex_hrs_q5", "strnex_mo_q5", "modex_hrs_q5", "modex_mo_q5", "limitd_vigact_q5", "limitd_modact_q5", "limitd_carrying_q5", "limitd_stairs_q5", "limitd_1stair_q5", "limitd_bending_q5", "limitd_wlkmile_q5", "limitd_wlkblcks_q5", "limitd_wlk1blck_q5", "limitd_bathing_q5", "bbaspr_perwk_q5", "aspr_perwk_q5", "ibupf_perwk_q5", "nsaid_perwk_q5", "cox2_perwk_q5", "actem_perwk_q5", "opiat_perwk", "statin_q5", "osteopmed_ever", "bisphos_q5", "ralox_q5", "oralcntr_aft00", "oralcntr_agelast_q5", "oralcntr_aft00_yrs", "agelastperiod_dk_q5", "agelastperiod_writdate_q5", "agelastperiod_mo_q5", "agelastperiod_yr_q5", "agelastperiod_writ_q5", "agelastperiod_bub_q5", "menstrual_statusus_q5", "hormo_aft05", "hormo_aft05_yrs", "cestro_aft05", "cestrodose_aft05", "estrad_aft05", "estraddose_aft05", "prog_aft05", "hormopil_aft05", "estropil_aft05", "progpil_aft05", "combpil_aft05", "hormopil_q5", "hormopil_yrstop", "hormoptch_aft05", "estropatch_aft05", "combpatch_aft05", "hormoptch_q5", "hormoptch_yrstop", "vagcrm_aft05", "vagcrm_q5", "vagcrm_yrstop", "combpil_type_q5", "combpatch_type_q5", "estro_type_q5", "prog_type_q5", "hormo_bioiden", "diab_self_q5", "diab_type_q5", "diab_age_q5", "diab_diag_untreat", "diab_diag_diet", "diab_diag_injec", "diab_diag_metfrm", "diab_diag_othmed", "diab_diag_oth", "diab_untreat_q5", "diab_diet_q5", "diab_injec_q5", "diab_metfrm_q5", "diab_othmed_q5", "diab_oth_q5", "diab_bldkit", "diab_bldkit_freq", "diab_a1c_last6mo", "diab_a1c_score", "feel_nocompanion", "feel_leftout_q5", "feel_isolated", "mri_b4_1900", "mri_1900_99", "mri_aft2000", "cthead_nevr", "cthead_b4_1900", "cthead_1900_99", "cthead_aft2000", "ctneck_nevr", "ctneck_b4_1900", "ctneck_1900_99", "ctneck_aft2000", "ctchest_nevr", "ctchest_b4_1900", "ctchest_1900_99", "ctchest_aft2000", "ctspine_nevr", "ctspine_b4_1900", "ctspine_1900_99", "ctspine_aft2000", "ctabdom_nevr", "ctabdom_b4_1900", "ctabdom_1900_99", "ctabdom_aft2000", "ctheart_nevr", "ctheart_b4_1900", "ctheart_1900_99", "ctheart_aft2000", "mammo_ever_q5", "mammo_whenlast", "mammo_howoft", "breastsurg_ever", "atypia_ever", "atypia_diag_age", "ct_colnscop_no", "ct_colnscop_scrn", "ct_colnscop_symp", "ct_colnscop_age", "colnscop_scrn", "colnscop_symp", "colnscop_age", "sigmscop_scrn", "sigmscop_symp", "sigmscop_age", "result_colnpoly", "result_rectpoly", "result_colnca", "result_none", "result_dk", "mulvit_howoft_q5", "mulvit_yrs_q5", "b12_howoft", "b12_yrs", "calcium_vitd_howoft", "calcium_vitd_yrs", "vitd3_howoft", "vitd4_yrs", "calcium_howoft_q5", "calcium_yrs_q5", "niacin_howoft", "niacin_yrs", "omega3_howoft", "omega3_yrs", "soypill_howoft", "soypill_yrs", "chondro_howoft", "chondro_yrs", "vitd3_howmch", "hbp_diag_q5", "hbp_diag_age", "hbp_medever_q5", "hbp_currmed_q5", "hrtatk_diag_q5", "hrtatk_diag_age", "hrtatk_medever", "hrtatk_currmed", "stroke_diag_q5", "stroke_medever", "stroke_currmed", "dvt_diag_q5", "dvt_medever_q5", "dvt_currmed_q5", "copd_diag_q5", "copd_medever", "copd_currmed", "osteop_diag_q5", "osteop_medever_q5", "osteop_currmed_q5", "pneu_diag_q5", "pneu_medever", "pneu_currmed", "parkins_diag_q5", "parkins_medever_q5", "parkins_currmed_q5", "depres_diag_q5", "depres_medever_q5", "depres_currmed_q5", "shingle_diag_q5", "shingle_medever_q5", "shingle_currmed_q5", "ulcer_diag_q5", "ulcer_medever", "ulcer_currmed", "kidnstn_diag_q5", "kidnstn_medever_q5", "kidnstn_currmed_q5", "kidndis_diag_q5", "kidndis_medever_q5", "kidndis_currmed_q5", "fatigu_diag_q5", "fatigu_medever_q5", "fatigu_currmed_q5", "osteoa_diag_q5", "osteoa_medever_q5", "osteoa_currmed_q5", "rheuma_diag_q5", "rheuma_medever_q5", "rheuma_currmed_q5", "lupus_diag_q5", "lupus_medever", "lupus_currmed", "crohns_diag_q5", "crohns_medever", "crohns_currmed", "sclero_diag_q5", "sclero_medever", "sclero_currmed", "psoria_diag_q5", "psoria_medever_q5", "psoria_currmed_q5", "lostheight", "lostheigh_inch", "gastricby", "gastricby_type", "bmi_q5", "weight_q5", "height_q5", "spffacecrm", "spffacecrm_yrs", "spffacecrm_undr15", "spffacecrm15_25", "spffacecrm26_40", "spffacecrm41_60", "spffacecrm_ovr61", "sunscrn", "sunscrn_yrs", "sunscrn_undr15", "sunscrn15_25", "sunscrn26_40", "sunscrn41_60", "sunscrn_ovr61", "tanbooth", "tanbooth_yrs", "tanbooth_undr15", "tanbooth15_25", "tanbooth26_40", "tanbooth41_60", "tanbooth_ovr61", "currres_yrs_q5mini", "strnex_hrs_q5mini", "strnex_mo_q5mini", "modex_hrs_q5mini", "modex_mo_q5mini", "diab_self_q5mini", "diab_type_q5mini", "hormo_aft05_mini", "hormo_aft05_yrs_mini", "menstrual_status_q5mini", "strenuous_hrs_per_wk_q6", "strenuous_mos_per_yr_q6", "moderate_hrs_per_wk_q6", "moderate_hrs_per_yr_q6", "osteoa_diag_q6", "rheuma_diag_q6", "asthma_diag_q6", "t2d_diag_q6", "dvt_diag_q6", "depres_diag_q6", "cholesterol_diag_q6", "dbp_diag_q6", "inflammatorybowel_diag_q6", "kidndis_diag_q6", "kidnstn_diag_q6", "migraines_diag_q6", "osteop_diag_q6", "parkins_diag_q6", "periodontal_diag_q6", "psoria_diag_q6", "shingle_diag_q6", "sleepapnea_diag_q6", "sleep_disorder_diag_q6", "genetic_testing_q6", "menstrual_status_q6", "age_lmp_q6", "used_mht_q6", "type_mht_is_pills_q6", "type_mht_patches_q6", "type_mht_estrogen_cream_q6", "type_mht_pills_q6", "curr_mht_pills_q6", "years_used_pills_q6", "curr_mht_patches_q6", "curr_mht_estrogen_cream_q6", "weight_q6", "height_feet_q6", "height_inches_q6", "snores_q6", "fatigued_day_q6", "stop_breath_night_q6", "difficult_fall_asleep_q6", "severe_diff_fall_asleep_q6", "severe_diff_stay_asleep_q6", "wake_too_early_q6", "satisfied_sleep_pattern_q6", "sleep_interfere_day_life_q6", "noticeable_sleep_problem_q6", "worry_abt_sleep_problem_q6", "chronic_sleep_problem_q6", "usual_glasses_water_q6", "usual_cups_coffee_q6", "usual_cups_tea_q6", "usual_glasses_icedtea_q6", "showers_per_week_q6", "water_source_curr_home_q6", "filter_tap_h2o_curr_home_q6", "worry_retirement_money_q6", "worry_serious_ill_cost_q6", "unpaid_medbills_past_yr_q6", "pay_medbills_over_time_q6", "unable_pay_medical_bills_q6", "household_income_q6", "ppl_support_house_income_q6", "minor_support_house_inc_q6", "senior_support_house_inc_q6", "lack_companionship_q6", "feel_left_out_q6", "feel_isolated_q6", "marital_status_q6", "employ_school_q6", "employ_other_q6", "employ_not_currently_q6", "employ_homemaker_q6", "employ_unable_work_q6", "employ_retired_q6", "ever_used_med_cannabis_q6", "medical_cannabis_method_q6", "cannabis_reason_anxiety_q6", "cannabis_reason_pain_q6", "cannabis_reason_sleep_q6", "cannabis_reason_relax_q6", "cannabis_reason_other_q6", "medi_cannabis_as_rx_med_q6", "happiness_q6", "recent_colonoscopy_q6", "recent_sigmoidoscopy_q6", "age_recent_colonoscopy_q6", "age_recent_sigmoidoscopy_q6", "recent_chest_xray_q6"]
;

console.log("-------------- all columns --------------");
console.log(JSON.stringify(all_columns));

//let questionnarie_columns = get_questionnarie_columns();
let questionnarie_columns =
    ["age_at_baseline", "adopted", "twin", "birthplace", "birthplace_mom", "birthplace_dad", "participant_race", "dad_race", "mom_race", "nih_ethnic_cat", "nih_race_cat", "nih_hisp_enroll", "age_mom_atbirth", "age_dad_atbirth", "older_bros_num", "older_sis_num", "younger_bros_num", "younger_sis_num", "employ_currschl", "employ_longschl", "teacher_type", "employ_numschl", "employ_schlyrs", "near_chemplnt", "near_powerplnt", "near_pulpmill", "near_oilrefine", "near_landfill", "powerln_currschl", "powerln_longschl", "powerln_currres", "powerln_longres", "pstcideskn_undr15", "pstcideskn15_35", "pstcideskn_ovr35", "pstcidehm_undr15", "pstcidehm15_35", "pstcidehm_ovr35", "pstcidecloud_undr15", "pstcidecloud15_35", "pstcidecloud_ovr35", "pstcidefarm_undr15", "pstcidefarm15_35", "pstcidefarm_ovr35", "elecblnket", "elecwatrbed", "elecrmheat", "eleclight", "sunskn_noprotec", "sunskn_repeat", "sunbrnblist", "sunbrnblist_age", "sunbrnblist_num", "menarche_age", "period_timetoreg", "period_daysbtwn", "oralcntr_ever_q1", "oralcntr_yrs", "bc_1stage", "bc_lastage", "fullterm_age1st", "preg_age1st", "livbirth_total", "stilbirth_total", "miscarr_total", "abort_total", "tubalpreg_total", "fullterm_total", "preg_ever_q1", "preg_curr_q1", "miscarr_age1st", "abort_age1st", "preg_agelast", "preg_total_q1", "livbirth_age1st", "breastfd_age1st", "breastfd_mo", "des_stopmiscarr", "preg_failed", "fertdrug_clomid", "fertdrug_danazol", "fertdrug_danocrn", "fertdrug_hcg", "fertdrug_milophn", "fertdrug_lupron", "fertdrug_nolvadx", "fertdrug_pergonl", "fertdrug_serophn", "fertdrug_synarel", "fertdrug_other", "fertdrug_none", "period_stop", "meno_statbasic", "meno_stattype", "meno_stattype_age", "agelastperiod_q1", "whyperiodstop_q1", "hysterectomy_age_q1", "ovaryremoved_q1", "ovaryremoved_age_q1", "tuballig_age_q1", "estroalone", "eplusp", "progalone", "ht_revusepattern", "ht_allpast_curr", "estroalone_dur", "progalone_dur", "eplusp_dur", "estroalone_start", "progalone_start", "eplusp_start", "estroalone_end", "progalone_end", "eplusp_end", "premarn_age1st", "premarn_agelast", "premarn_totyrs", "premarn_grn_q1", "premarn_brwn_q1", "premarn_wht_q1", "premarn_yelorn_q1", "premarn_prpl_q1", "premarn_longest", "estro_mouth", "estro_inject", "estro_patch_impl", "estro_vag", "prog_ever", "meno_ht_statcomb", "prog_age1st", "prog_agelast", "prog_totyrs", "prog_days_mo_q1", "provera_dose_q1", "brca", "brca_age1st", "brimplant", "brimplant_age1st", "brimplant_type", "mammo_ever_q1", "brexam", "papsmr", "mammo_yrssnce_ques62", "brexam_yrssnce_ques62", "papsmr_yrssnce_ques62", "brexam_lastyr", "bldtrans_never", "bldtrans_undr35", "bldtrans35_44", "bldtrans45_54", "bldtrans55_64", "bldtrans_ovr64", "height_q1", "weight_q1", "height_age18", "weight_age18", "bmi_q1", "bmi_age18", "aspr_totyrs", "aspr_days_wk", "acetm_totyrs", "acetm_days_wk", "ibupf_totyrs", "ibupf_days_wk", "tagam_totyrs", "tagam_days_wk", "resprn_totyrs", "resprn_days_wk", "wtrpil_totyrs", "wtrpil_days_wk", "hbpmed_totyrs", "hbpmed_days_wk", "calcium_totyrs", "calcium_days_wk", "nsaid_totyrs", "nsaid_days", "brca_self_ovr50_q1", "brca_self_undr50_q1", "endoca_self_q1", "cervca_self_q1", "ovryca_self_q1", "lungca_self_q1", "leuk_self_q1", "hodg_self_q1", "colnca_self_q1", "thyrca_self_q1", "meln_self_q1", "nevrca_self_q1", "nevrca_mom_q1", "nevrca_dad_q1", "gallstn_self", "diab_self_q1", "hipfrac_self", "fibroid_self", "endomtrs_self", "migrain_self", "brstbiop_self", "colnpoly_self", "thyrdis_self", "molesrmv_self", "stroke_self_q1", "hrtatk_self_q1", "hbp_self_q1", "brca_selfsurvey", "brca_famhis", "endoca_famhis", "ovryca_famhis", "cervca_famhis", "lungca_famhis", "leuk_famhis", "hodg_famhis", "thyrca_famhis", "colnca_famhis", "meln_famhis", "prosca_famhis", "strnex_hs_hrs", "strnex18_24hrs", "strnex25_34hrs", "strnex35_44hrs", "strnex45_54hrs", "strnex_hrs_q1", "modex_hs_hrs", "modex18_24hrs", "modex25_34hrs", "modex35_44hrs", "modex45_54hrs", "modex_hrs_q1", "strnex_life_hrs", "modex_life_hrs", "allex_hs_hrs", "allex18_24hrs", "allex25_34hrs", "allex35_44hrs", "allex45_54hrs", "allex_hrs_q1", "allex_life_hrs", "strnex_fix_q1", "modex_fix_q1", "caswalk_hrs", "caswalk_days", "housewrk_hrs", "housewrk_days", "stand_hrs", "stand_days", "sit_hrs", "sit_days", "sleep_hrs", "sleep_days", "vit_reg_no", "mulvit_days", "mulvit_yrs_q1", "vita_days_q1", "vita_yrs_q1", "bcar_days", "bcar_yrs", "vitc_days_q1", "vitc_yrs_q1", "vite_days_q1", "vite_yrs_q1", "selen_days", "selen_yrs", "daily_fiber", "daily_prot", "daily_fat", "daily_calcium", "daily_sfat", "daily_oleic", "daily_lino", "daily_chol", "daily_folate", "perccal_fat", "totdiet_caroten", "totdaily_kcal", "totdaily_carb", "glyc_avgdaily", "glyc_avgtot", "diet_plant", "diet_highprotfat", "diet_highcarb", "dief_ethnic", "diet_saladwine", "vit_mulvit_q1", "mulvit_perwk", "vit_perwk", "mulvit_dur_yrs", "vita_bcar_amt", "vita_amt", "bcar_amt", "vitc_amt", "vite_amt", "selen_amt", "serv_fats_q1", "serv_vegs_q1", "serv_fruit_q1", "serv_cere_q1", "serv_milk_q1", "lo_cheese_q1", "lo_icecrm_q1", "lo_dressn_q1", "lo_cake_q1", "addsalt_q1", "chickn_skn_q1", "meatfat_q1", "meat_charbroil_q1", "meat_cooked_q1", "alchl_g_day18_22", "alchl_g_day30_35", "alchl_g_dayrecen", "beer_g_day18_22", "wine_g_day18_22", "liqu_g_day18_22", "beer_g_day30_35", "wine_g_day30_35", "liqu_g_day30_35", "beer_g_dayrecen", "wine_g_dayrecen", "liqu_g_dayrecen", "alchl_analyselig", "alchl_analyscat", "smoke_lifeexpo", "smoke_group", "life_exposure_smk", "smoke_statcat", "smoke_expocat", "passmok_expocat", "cig_age1st", "cig_agelast", "smoke_totyrs", "smoke_totpackyrs", "smoke_yrs_quit", "smokeb4preg_yrs", "smokeafpreg_yrs", "smoke_1stpreg", "cig_day_avg", "shsmok_child", "shsmok_adult", "shsmok_child_hm", "shsmok_adult_hm", "shsmok_child_wrk", "shsmok_adult_wrk", "shsmok_child_oth", "shsmok_adult_oth", "shsmok_any", "shsmok_any_hm", "shsmok_any_wrk", "shsmok_any_oth", "shsmok_any_yrs", "shsmok_adult_yrs", "shsmok_child_yrs", "shsmok_any_sev", "shsmok_adult_sev", "shsmok_child_sev", "shsmok_any_int", "shsmok_adult_int", "shsmok_child_int", "preg_total_q2", "preg_snceq1_no", "preg_snceq1_live", "preg_snceq1_miss", "preg_snceq1_abor", "preg_snceq1_ecto", "preg_snceq1_stil", "preg_snceq1_curr", "preg_nausea_num", "preg_nausea_trt", "preg_recen_trt", "preeclamp_all", "preeclamp_recen", "mammo_ovr20", "xrayribs_undr20", "xrayribs_ovr20", "xrayback_undr20", "xrayback_ovr20", "xraychest_undr20", "xraychest_ovr20", "xraygi_undr20", "xraygi_ovr20", "xrayspine_undr20", "xrayspine_ovr20", "xraykidny_undr20", "xraykidny_ovr20", "fluorosco_undr20", "fluorosco_ovr20", "ctscan_undr20", "ctscan_ovr20", "radiat_th_undr20", "butt_avg_q2", "waist_avg_q2", "waisthip_ratio_q2", "waisthip_elig", "employ_fultch_q3", "employ_prttch_q3", "employ_fulschl_q3", "employ_prtschl_q3", "employ_fuloth_q3", "employ_prtoth_q3", "employ_self_q3", "employ_retired_q3", "employ_none_q3", "employ_homemak_q3", "employ_disabl_q3", "lastjob_yrssnce", "currjob_learning", "currjob_repetitv", "currjob_creative", "currjob_decision", "currjob_highskil", "currjob_lowfree", "currjob_varied", "currjob_lotofsay", "currjob_develop", "currjob_workfast", "currjob_workhard", "currjob_physical", "currjob_notexces", "currjob_givntime", "currjob_secure", "currjob_feelsafe", "currjob_noconfli", "currjob_competnt", "currjob_interest", "currjob_friendly", "currjob_helpful", "currjob_concern", "currjob_attentiv", "currjob_supvhelp", "currjob_supvppl", "jobabsent_times", "soc_relativ_num", "soc_friend_num", "soc_see_num", "soc_talk_num", "soc_relig_times", "soc_othgrp_times", "househld_num", "househld_kid_num", "marital_status_q3", "care_partner", "care_family", "care_friends", "undrstnd_partner", "undrstnd_family", "undrstnd_friends", "rely_partner", "rely_family", "rely_friends", "open_partner", "open_family", "open_friends", "demand_partner", "demand_family", "demand_friends", "crit_partner", "crit_family", "crit_friends", "letdown_partner", "letdown_family", "letdown_friends", "annoy_partner", "annoy_family", "annoy_friends", "feel_top", "feel_unhappy", "feel_bored", "feel_excited", "feel_hardbeclose", "feel_restless", "feel_leftout_q3", "feel_upsetcrit", "feel_lonely", "feel_compliment", "feel_keepdistant", "feel_goingmyway", "feel_accomplish", "happy", "oralcntr_ever_q3", "oralcntr_usebyq3", "oralcntr_mo", "period_nostop", "whyperiodstop_q3", "period_stopyear", "hormo_meno", "hormo_mo", "hormo_lastmo", "htcomb_4yrs_no", "htcomb_4yrs_ppro", "htcomb_4yrs_ppha", "htcomb_4yrs_oth", "estro_last4yrs", "prog_last4yrs", "estro_days_mo", "prog_days_mo_q3", "htcomb_4yrs", "asthma_q3", "asthma_age_q3", "asthma_diag_age", "asthmasym_not_q3", "asthmasym_mild_q3", "asthmasym_meds_q3", "asthmasym_doc_q3", "asthmasym_hosp_q3", "asthmasym_nmild", "asthmasym_ymild", "asthma_severity", "insulin_daily", "oralhyp_daily", "diuret_daily", "lasix_daily", "calciumblck_daily", "aceinhb_daily", "othhbp_daily", "tagam_daily", "h2blck_daily", "tamox_daily", "ralox_daily", "steroid_daily", "brondil_daily", "cholmed_daily", "antidep_daily", "lr_handed", "currres_yrs", "calires_yrs", "bdrmppl_6mo", "bdrmppl_age3", "bdrmppl_age5", "bdrmppl_age12", "bdrmppl_age30", "bdrmppl_now", "daycare_6mo", "daycare_age3", "daycare_age5", "pet_6mo", "pet_age3", "pet_age5", "pet_age12", "pet_age30", "pet_now", "hoofanm_6mo", "hoofanm_age3", "hoofanm_age5", "hoofanm_age12", "hoofanm_age30", "hoofanm_now", "hmrent_6mo", "hmrent_age3", "hmrent_age5", "hmrent_age12", "hmrent_age30", "hmrent_now", "ruralurb_6mo", "ruralurb_age3", "ruralurb_age5", "ruralurb_age12", "ruralurb_age30", "ruralurb_now", "bbaspr_perwk_q4", "aspr_perwk_q4", "ibupf_perwk_q4", "nsaid_perwk_q4", "cox2_perwk_q4", "actem_perwk_q4", "stopbbaspr", "stopaspr", "stopibupf", "stopnsaid", "stopcox2", "stopacetm", "stopbbaspr_impr", "stopaspr_impr", "stopibupf_impr", "stopnsaid_impr", "stopcox2_impr", "stopacetm_impr", "stopbbaspr_dnwrk", "stopaspr_dnwrk", "stopibupf_dnwrk", "stopnsaid_dnwrk", "stopcox2_dnwrk", "stopacetm_dnwrk", "stopbbaspr_side", "stopaspr_side", "stopibupf_side", "stopnsaid_side", "stopcox2_side", "stopacetm_side", "stopbbaspr_hear", "stopaspr_hear", "stopibupf_hear", "stopnsaid_hear", "stopcox2_hear", "stopacetm_hear", "stopbbaspr_unav", "stopaspr_unav", "stopibupf_unav", "stopnsaid_unav", "stopcox2_unav", "stopacetm_unav", "stopbbaspr_oth", "stopaspr_oth", "stopibupf_oth", "stopnsaid_oth", "stopcox2_oth", "stopacetm_oth", "statin_q4", "steroidpil_q4", "steroid_inh_q4", "othanti_inh_q4", "oral_anti_q4", "brondil_inh_q4", "brondil_linh_q4", "abio_wks_q4", "ralox_tamox_ever", "ralox_mo", "tamox_mo", "ralox_tamox_q4", "otcount_hormprep", "otcount_soyestro", "otcount_dongquai", "otcount_natprog", "otcount_blkcoho", "otcount_flaxseed", "menstrual_status_q4", "postmeno", "agelastperiod_q4", "ht_last5yrs", "ht_last5yrs_mo", "ht_ppro_offwht", "ht_ppro_gold", "ht_ppro_peach", "ht_ppro_blue", "ht_ppro_unknwn", "ht_ppha", "ht_combiptch", "ht_femhrt", "ht_estratest", "ht_othcom", "ht_nocom", "premarn_grn_q4", "premarn_blue_q4", "premarn_maroon_q4", "premarn_wht_q4", "premarn_orn_q4", "premarn_unknwn_q4", "ht_estrace", "ht_ogen", "ht_othorale", "ht_no_orale", "ht_estropatch", "ht_estrovag", "ht_no_othestro", "provera_2_5mg_q4", "provera_5_9mg_q4", "provera_10mg_q4", "provera_ovr10mg_q4", "provera_dk_q4", "ht_progestin_oth", "ht_noprog_oral", "ht_orale_days_mo", "ht_oralp_days_mo", "ht_q4", "diab_pre_q4", "diab_gest_q4", "diab_1_2_q4", "diab_pre_age_q4", "diab_gest_age_q4", "diab_1_2_age_q4", "diab_insulin", "diab_insulin_yrs", "diab_oralhyp", "diab_oralhyp_yrs", "asthma_diag_q4", "asthma_age_q4", "asthma_diagyr_q4", "asthmasym_freq_q4", "asthmasym_not_q4", "asthmasym_mild_q4", "asthmasym_meds_q4", "asthmasym_doc_q4", "asthmasym_hosp_q4", "pneu_ever", "hayfever_ever", "parkins_ever_q4", "parkins_age_q4_raw", "moonucl_ever", "endomtrs_ever", "mastitis_ever", "strnex_hrs_q4", "strnex_mo_q4", "strnex_avg_q4", "allex_avg_q4", "modex_hrs_q4", "modex_mo_q4", "modex_avg_q4", "stairs_perday", "limitd_vigact_q4", "limitd_modact_q4", "limitd_stairs_q4", "limitd_1stair_q4", "limitd_wlkmile_q4", "limitd_wlkblcks_q4", "limitd_wlk1blck_q4", "limitd_carrying_q4", "limitd_bending_q4", "limitd_bathing_q4", "weight_q4", "bmi_q4", "lost20lb_times", "gain20lb_times", "bodyb50", "bodya50", "self_sex", "diet_analyselig", "serv_vegs_q4", "serv_fruit_q4", "serv_cere_q4", "lo_cheese_q4", "lo_yogurt_q4", "lo_dressn_q4", "lo_icecrm_q4", "lo_cake_q4", "addsugar_q4", "addbutr_veg_q4", "addmarg_veg_q4", "addbutr_brd_q4", "addmarg_brd_q4", "meatfat_q4", "chickn_skn_q4", "mulvit_reg", "vita_reg", "vitc_reg", "vite_reg", "calcium_reg", "mulvit_freq", "mulvit_yrs_q4", "vita_freq", "vita_yrs_q4", "vitc_freq", "vitc_yrs_q4", "vite_freq", "vite_yrs_q4", "calcium_freq", "calcium_yrs_q4", "mulvit_miner", "mulvit_antiox", "vitc_mg", "vite_mg", "preg_ever_q4", "smokeb4preg_cig", "smokedurpreg_cig", "smokeb4preg_no", "smokedurpreg_no", "smokeb4preg_hm", "smokedurpreg_hm", "smokeb4preg_wrk", "smokedurpreg_wrk", "smokeb4preg_oth", "smokedurpreg_oth", "livbirth_1stpreg", "livbirth_ever", "smokeb4livb_cig", "smokedurlivb_cig", "smokeb4livb_no", "smokedurlivb_no", "smokeb4livb_hm", "smokedurlivb_hm", "smokeb4livb_wrk", "smokedurlivb_wrk", "smokeb4livb_oth", "smokedurlivb_oth", "hlthinsur_mdcare", "hlthinsur_comb", "retired_q4", "retired_spous", "edu_self", "edu_self_comb", "edu_spous", "edu_spous_comb", "edu_mom", "edu_mom_comb", "edu_dad", "edu_dad_comb", "household_income_q4", "ppl_support_house_income_q4", "minor_support_house_inc_q4", "senior_support_house_inc_q4", "menstrual_status_q4mini", "postmeno_mini", "agelastperiod_q4mini", "ht_last5yrs_mini", "ht_last5yrs_mo_mini", "ht_ppro_offwht_mini", "ht_ppro_gold_mini", "ht_ppro_peach_mini", "ht_ppro_blue_mini", "ht_ppro_unknwn_mini", "ht_ppha_mini", "ht_combiptch_mini", "ht_femhrt_mini", "ht_estratest_mini", "ht_othcom_mini", "ht_nocom_mini", "premarn_grn_q4mini", "premarn_blue_q4mini", "premarn_maroon_q4mini", "premarn_wht_q4mini", "premarn_orn_q4mini", "premarn_unknwn_q4mini", "ht_estrace_mini", "ht_ogen_mini", "ht_othorale_mini", "ht_no_orale_mini", "ht_estropatch_mini", "ht_estrovag_mini", "ht_no_othestro_mini", "provera_2_5mg_q4mini", "provera_5_9mg_q4mini", "provera_10mg_q4mini", "provera_ovr10mg_q4mini", "provera_dk_q4mini", "ht_progestin_oth_mini", "ht_noprog_oral_mini", "ht_orale_days_mo_mini", "ht_oralp_days_mo_mini", "ht_q4mini", "ralox_ever_mini", "ralox_mo_mini", "ralox_q4mini", "otcount_hormprep_mini", "otcount_soyestro_mini", "otcount_dongquai_mini", "otcount_natprog_mini", "otcount_blkcoho_mini", "otcount_flaxseed_mini", "weight_q4mini", "marital_status_q5", "employ_schl_q5", "employ_oth_q5", "employ_return_q5", "employ_unable_q5", "employ_homemak_q5", "employ_retired_q5", "sleep_quality", "sleep_fall", "sleep_hrs_night", "sleep_trouble", "sleep_reg_lastyr", "sleep_reg2_5yrs", "sleep_reg6_10yrs", "sleep_reg_ovr11yrs", "sleep_med_howoft", "sleep_type_teen", "sleep_type30_40", "sleep_type_now", "colds_howoft", "hrswithchildren", "stand_wrk_hrs", "stand_hm_hrs", "sit_wrk_hrs", "sit_car_hrs", "sit_tv_hrs", "sit_read_hrs", "sit_oth_hrs", "lightex_hrs", "walk_hrs", "weighttrain_hrs", "walk_normalpace", "strnex_hrs_q5", "strnex_mo_q5", "modex_hrs_q5", "modex_mo_q5", "limitd_vigact_q5", "limitd_modact_q5", "limitd_carrying_q5", "limitd_stairs_q5", "limitd_1stair_q5", "limitd_bending_q5", "limitd_wlkmile_q5", "limitd_wlkblcks_q5", "limitd_wlk1blck_q5", "limitd_bathing_q5", "bbaspr_perwk_q5", "aspr_perwk_q5", "ibupf_perwk_q5", "nsaid_perwk_q5", "cox2_perwk_q5", "actem_perwk_q5", "opiat_perwk", "statin_q5", "osteopmed_ever", "bisphos_q5", "ralox_q5", "oralcntr_aft00", "oralcntr_agelast_q5", "oralcntr_aft00_yrs", "agelastperiod_dk_q5", "agelastperiod_writdate_q5", "agelastperiod_mo_q5", "agelastperiod_yr_q5", "agelastperiod_writ_q5", "agelastperiod_bub_q5", "menstrual_statusus_q5", "hormo_aft05", "hormo_aft05_yrs", "cestro_aft05", "cestrodose_aft05", "estrad_aft05", "estraddose_aft05", "prog_aft05", "hormopil_aft05", "estropil_aft05", "progpil_aft05", "combpil_aft05", "hormopil_q5", "hormopil_yrstop", "hormoptch_aft05", "estropatch_aft05", "combpatch_aft05", "hormoptch_q5", "hormoptch_yrstop", "vagcrm_aft05", "vagcrm_q5", "vagcrm_yrstop", "combpil_type_q5", "combpatch_type_q5", "estro_type_q5", "prog_type_q5", "hormo_bioiden", "diab_self_q5", "diab_type_q5", "diab_age_q5", "diab_diag_untreat", "diab_diag_diet", "diab_diag_injec", "diab_diag_metfrm", "diab_diag_othmed", "diab_diag_oth", "diab_untreat_q5", "diab_diet_q5", "diab_injec_q5", "diab_metfrm_q5", "diab_othmed_q5", "diab_oth_q5", "diab_bldkit", "diab_bldkit_freq", "diab_a1c_last6mo", "diab_a1c_score", "feel_nocompanion", "feel_leftout_q5", "feel_isolated", "mri_b4_1900", "mri_1900_99", "mri_aft2000", "cthead_nevr", "cthead_b4_1900", "cthead_1900_99", "cthead_aft2000", "ctneck_nevr", "ctneck_b4_1900", "ctneck_1900_99", "ctneck_aft2000", "ctchest_nevr", "ctchest_b4_1900", "ctchest_1900_99", "ctchest_aft2000", "ctspine_nevr", "ctspine_b4_1900", "ctspine_1900_99", "ctspine_aft2000", "ctabdom_nevr", "ctabdom_b4_1900", "ctabdom_1900_99", "ctabdom_aft2000", "ctheart_nevr", "ctheart_b4_1900", "ctheart_1900_99", "ctheart_aft2000", "mammo_ever_q5", "mammo_whenlast", "mammo_howoft", "breastsurg_ever", "atypia_ever", "atypia_diag_age", "ct_colnscop_no", "ct_colnscop_scrn", "ct_colnscop_symp", "ct_colnscop_age", "colnscop_scrn", "colnscop_symp", "colnscop_age", "sigmscop_scrn", "sigmscop_symp", "sigmscop_age", "result_colnpoly", "result_rectpoly", "result_colnca", "result_none", "result_dk", "mulvit_howoft_q5", "mulvit_yrs_q5", "b12_howoft", "b12_yrs", "calcium_vitd_howoft", "calcium_vitd_yrs", "vitd3_howoft", "vitd4_yrs", "calcium_howoft_q5", "calcium_yrs_q5", "niacin_howoft", "niacin_yrs", "omega3_howoft", "omega3_yrs", "soypill_howoft", "soypill_yrs", "chondro_howoft", "chondro_yrs", "vitd3_howmch", "hbp_diag_q5", "hbp_diag_age", "hbp_medever_q5", "hbp_currmed_q5", "hrtatk_diag_q5", "hrtatk_diag_age", "hrtatk_medever", "hrtatk_currmed", "stroke_diag_q5", "stroke_medever", "stroke_currmed", "dvt_diag_q5", "dvt_medever_q5", "dvt_currmed_q5", "copd_diag_q5", "copd_medever", "copd_currmed", "osteop_diag_q5", "osteop_medever_q5", "osteop_currmed_q5", "pneu_diag_q5", "pneu_medever", "pneu_currmed", "parkins_diag_q5", "parkins_medever_q5", "parkins_currmed_q5", "depres_diag_q5", "depres_medever_q5", "depres_currmed_q5", "shingle_diag_q5", "shingle_medever_q5", "shingle_currmed_q5", "ulcer_diag_q5", "ulcer_medever", "ulcer_currmed", "kidnstn_diag_q5", "kidnstn_medever_q5", "kidnstn_currmed_q5", "kidndis_diag_q5", "kidndis_medever_q5", "kidndis_currmed_q5", "fatigu_diag_q5", "fatigu_medever_q5", "fatigu_currmed_q5", "osteoa_diag_q5", "osteoa_medever_q5", "osteoa_currmed_q5", "rheuma_diag_q5", "rheuma_medever_q5", "rheuma_currmed_q5", "lupus_diag_q5", "lupus_medever", "lupus_currmed", "crohns_diag_q5", "crohns_medever", "crohns_currmed", "sclero_diag_q5", "sclero_medever", "sclero_currmed", "psoria_diag_q5", "psoria_medever_q5", "psoria_currmed_q5", "lostheight", "lostheigh_inch", "gastricby", "gastricby_type", "bmi_q5", "weight_q5", "height_q5", "spffacecrm", "spffacecrm_yrs", "spffacecrm_undr15", "spffacecrm15_25", "spffacecrm26_40", "spffacecrm41_60", "spffacecrm_ovr61", "sunscrn", "sunscrn_yrs", "sunscrn_undr15", "sunscrn15_25", "sunscrn26_40", "sunscrn41_60", "sunscrn_ovr61", "tanbooth", "tanbooth_yrs", "tanbooth_undr15", "tanbooth15_25", "tanbooth26_40", "tanbooth41_60", "tanbooth_ovr61", "currres_yrs_q5mini", "strnex_hrs_q5mini", "strnex_mo_q5mini", "modex_hrs_q5mini", "modex_mo_q5mini", "diab_self_q5mini", "diab_type_q5mini", "hormo_aft05_mini", "hormo_aft05_yrs_mini", "menstrual_status_q5mini", "strenuous_hrs_per_wk_q6", "strenuous_mos_per_yr_q6", "moderate_hrs_per_wk_q6", "moderate_hrs_per_yr_q6", "osteoa_diag_q6", "rheuma_diag_q6", "asthma_diag_q6", "t2d_diag_q6", "dvt_diag_q6", "depres_diag_q6", "cholesterol_diag_q6", "dbp_diag_q6", "inflammatorybowel_diag_q6", "kidndis_diag_q6", "kidnstn_diag_q6", "migraines_diag_q6", "osteop_diag_q6", "parkins_diag_q6", "periodontal_diag_q6", "psoria_diag_q6", "shingle_diag_q6", "sleepapnea_diag_q6", "sleep_disorder_diag_q6", "genetic_testing_q6", "menstrual_status_q6", "age_lmp_q6", "used_mht_q6", "type_mht_is_pills_q6", "type_mht_patches_q6", "type_mht_estrogen_cream_q6", "type_mht_pills_q6", "curr_mht_pills_q6", "years_used_pills_q6", "curr_mht_patches_q6", "curr_mht_estrogen_cream_q6", "weight_q6", "height_feet_q6", "height_inches_q6", "snores_q6", "fatigued_day_q6", "stop_breath_night_q6", "difficult_fall_asleep_q6", "severe_diff_fall_asleep_q6", "severe_diff_stay_asleep_q6", "wake_too_early_q6", "satisfied_sleep_pattern_q6", "sleep_interfere_day_life_q6", "noticeable_sleep_problem_q6", "worry_abt_sleep_problem_q6", "chronic_sleep_problem_q6", "usual_glasses_water_q6", "usual_cups_coffee_q6", "usual_cups_tea_q6", "usual_glasses_icedtea_q6", "showers_per_week_q6", "water_source_curr_home_q6", "filter_tap_h2o_curr_home_q6", "worry_retirement_money_q6", "worry_serious_ill_cost_q6", "unpaid_medbills_past_yr_q6", "pay_medbills_over_time_q6", "unable_pay_medical_bills_q6", "household_income_q6", "ppl_support_house_income_q6", "minor_support_house_inc_q6", "senior_support_house_inc_q6", "lack_companionship_q6", "feel_left_out_q6", "feel_isolated_q6", "marital_status_q6", "employ_school_q6", "employ_other_q6", "employ_not_currently_q6", "employ_homemaker_q6", "employ_unable_work_q6", "employ_retired_q6", "ever_used_med_cannabis_q6", "medical_cannabis_method_q6", "cannabis_reason_anxiety_q6", "cannabis_reason_pain_q6", "cannabis_reason_sleep_q6", "cannabis_reason_relax_q6", "cannabis_reason_other_q6", "medi_cannabis_as_rx_med_q6", "happiness_q6", "recent_colonoscopy_q6", "recent_sigmoidoscopy_q6", "age_recent_colonoscopy_q6", "age_recent_sigmoidoscopy_q6", "recent_chest_xray_q6"]
;
console.log("-------------- questionnarie columns --------------");
console.log(JSON.stringify(questionnarie_columns));

let meta_columns_2 = all_columns.filter(x => !questionnarie_columns.includes(x));
console.log("-------------- meta columns --------------");
console.log(JSON.stringify(meta_columns_2));


app.get('/api/download/data/:id/:abbrev', (req, res) => {
    const id = req.params.id;
    const abbrev = req.params.abbrev;

    Project.findOne({
        where: {id: id},
    }).then(project => {

        if (project.cancer_endpoint) {
            project.cancer_endpoint = JSON.parse(project.cancer_endpoint);
        }

        if (project.start_of_follow_up) {
            project.start_of_follow_up = JSON.parse(project.start_of_follow_up);
        }

        if (project.censoring_rules) {
            project.censoring_rules = JSON.parse(project.censoring_rules);
        }

        if (project.questionnarie) {
            project.questionnarie = JSON.parse(project.questionnarie);
        }

        //console.log("\n=========== download =============");
        //console.log(JSON.stringify(project));

        //console.log("\n=========== project questionnarie =============");
        //console.log(JSON.stringify(project.questionnarie));

        //const db = new Database('cts.sqlite', {verbose: console.log});

        var sqlite3 = require('sqlite3').verbose();
        var file = "cts.sqlite";
        var db = new sqlite3.Database(file);
        db.serialize(function () {

            let table_name = `ssap_data_${id}_${new Date().getTime()}`;

            let sql = `PRAGMA temp_store = 2`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            // create a temporary table
            sql = `CREATE TEMP TABLE ${table_name} AS SELECT * FROM ssap_data_2`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            // create an index for the temporary table
            sql = `CREATE INDEX ${table_name}_idx ON ${table_name}(ssap_id)`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            // check
            sql = `SELECT count(*) FROM ${table_name}`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function (err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} size: ` + JSON.stringify(row));
                })
            });

            // delete the rows with breast_cancer_res_only_ind = 1 when 26000 is not in the selection
            let seer_ids = [];
            for (var j = 0; j < project.cancer_endpoint.length; j++) {
                let item = project.cancer_endpoint[j];
                seer_ids.push(item.SEER_ID);
            }

            sql = `DELETE FROM ${table_name} WHERE breast_cancer_res_only_ind = 1`;
            if (!seer_ids.includes('26000')) {
                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);
            }

            // check
            sql = `SELECT count(*) FROM ${table_name}`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function (err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} size after deleting breast_cancer_res_only_ind = 1 : ` + JSON.stringify(row));
                })
            });

            // If a user selects Questionnaire 2-Questionnaire 6 as the start date,
            // remove all rows where their selected date is null.
            if (project.start_of_follow_up.start_of_follow_up.startsWith("QNR_") &&
                !project.start_of_follow_up.start_of_follow_up.startsWith("QNR_1")) {
                sql = `
                    DELETE FROM ${table_name}
                     WHERE ${project.start_of_follow_up.start_of_follow_up} is NULL
                        OR ${project.start_of_follow_up.start_of_follow_up}=''
                `;
                console.log("---------------------------------------------------");
                console.log(sql);
                db.run(sql);

                // check
                sql = `SELECT count(*) FROM ${table_name}`;
                console.log("---------------------------------------------------");
                console.log(sql);
                db.all(sql, function (err, rows) {
                    rows.forEach(function (row) {
                        console.log(`table ${table_name} size after delete NULL start of follow up` + JSON.stringify(row));
                    })
                });
            }

            // Add a new column to the analytic data called analysis_start_date
            sql = `ALTER TABLE ${table_name} ADD COLUMN analysis_start_date TEXT`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            // populate analysis_start_date with the user's selection
            if (project.start_of_follow_up.start_of_follow_up.startsWith("QNR_")) {
                sql = `UPDATE ${table_name} SET analysis_start_date=${project.start_of_follow_up.start_of_follow_up}`
                console.log("---------------------------------------------------");
                console.log(sql);
                db.run(sql);
            } else if (project.start_of_follow_up.start_of_follow_up.startsWith("Other") &&
                project.start_of_follow_up.start_of_follow_up_specified) {
                let other_date = project.start_of_follow_up.start_of_follow_up_specified.split('T')[0];
                sql = `UPDATE ${table_name} SET analysis_start_date='${other_date}'`;
                console.log("---------------------------------------------------");
                console.log(sql);
                db.run(sql);
            }

            // Add a new column to the analytic data called end_of_followup_date.
            sql = `ALTER TABLE ${table_name} ADD COLUMN end_of_followup_date TEXT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            if (project.censoring_rules.through_2015_12_31) {
                // If the user answers "Yes" to the first question of censering rule,
                // populate it with the user's selection (the admin_censoring_date -- currently 12/31/2017).
                let end_date = "2017-12-31";
                sql = `UPDATE ${table_name} SET end_of_followup_date='${end_date}'`;
                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);
            } else if (project.censoring_rules.end_of_follow_up.startsWith("QNR_")) {
                // If the user answer "No" to the first question of censering rule and selects another date,
                // populate end_of_followup_date with their selected date.
                sql = `UPDATE ${table_name} SET end_of_followup_date=${project.censoring_rules.end_of_follow_up}`;
                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);
            } else if (project.censoring_rules.end_of_follow_up.startsWith("Other") &&
                project.censoring_rules.end_of_follow_up_specified) {
                // If the user answer "No" to the first question of censering rule and selects another date,
                // populate end_of_followup_date with their selected date.
                let other_date = project.censoring_rules.end_of_follow_up_specified.split('T')[0];
                sql = `UPDATE ${table_name} SET end_of_followup_date='${other_date}'`;
                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);
            }

            // create a new column, case_indicator
            sql = `ALTER TABLE ${table_name} ADD COLUMN case_indicator INT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // marks rows that meet the user's endpoint definition and date_dt > analysis_start_date
            // with a 1 and all other rows with a 0.
            sql = `
                UPDATE ${table_name}
                   SET case_indicator=1
                 WHERE date_dt > analysis_start_date
                   AND ${getCoditionForCancerEndpoint(project.cancer_endpoint)}
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql = `UPDATE ${table_name} SET case_indicator=0 WHERE case_indicator is NULL`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // check
            sql = `SELECT count(*) FROM ${table_name} WHERE case_indicator=1`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function (err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} size for case_indicator=1: ` + JSON.stringify(row));
                })
            });

            // check
            sql = `SELECT count(*) FROM ${table_name} WHERE case_indicator=0`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function (err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} size for case_indicator=0: ` + JSON.stringify(row));
                })
            });

            // add a new column prevalent
            sql = `ALTER TABLE ${table_name} ADD COLUMN prevalent INT`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            if (project.start_of_follow_up.start_of_follow_up_exclude) {
                if (project.start_of_follow_up.start_of_follow_up_exclude === 'exclude all') {

                    // If DATE_DT is not NULL and DATE_DT < analysis_start_date
                    // OR brca_selfsurvey='Y' or endoca_self_q1='A' or cervca_self_q1='A'
                    // or ovryca_self_q1='A' or lungca_self_q1='A' or leuk_self_q1='A'
                    // or hodg_self_q1='A' or colnca_self_q1='A' or thyrca_self_q1='A'
                    // or meln_self_q1='A', then prevalent=1

                    sql =
                        `UPDATE ${table_name} SET prevalent=1
                          WHERE (NOT DATE_DT is NULL and DATE_DT < analysis_start_date)
                             OR brca_selfsurvey='Y'
                             OR endoca_self_q1='A'
                             OR cervca_self_q1='A'
                             OR ovryca_self_q1='A'
                             OR lungca_self_q1='A'
                             OR leuk_self_q1='A'
                             OR hodg_self_q1='A'
                             OR colnca_self_q1='A'
                             OR thyrca_self_q1='A'
                             OR meln_self_q1='A'
                        `;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.run(sql);

                    // Remove ALL ROWS for participants that have even just one row where prevalent=1
                    sql = `DELETE FROM ${table_name} WHERE ssap_id IN (SELECT DISTINCT ssap_id FROM ${table_name} WHERE prevalent=1)`;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.run(sql);

                } else if (project.start_of_follow_up.start_of_follow_up_exclude === 'exclude interest') {

                    let cmd =
                        `UPDATE ${table_name} SET prevalent=1
                        WHERE ${getCoditionForCancerEndpoint(project.cancer_endpoint)}
                          AND (NOT DATE_DT is NULL and DATE_DT < analysis_start_date`;

                    var found = false;
                    if (seer_ids.includes('26000')) {
                        // User selection includes SEER_ID=26000:
                        // If row meets the user's endpoint definition
                        // and DATE_DT is not NULL and DATE_DT < analysis_start_date
                        // OR brca_selfsurvey='Y'
                        // then prevalent=1
                        cmd += ` OR brca_selfsurvey='Y' `;
                        found = true;
                    }

                    if (seer_ids.includes('27020') || seer_ids.includes('27030')) {
                        cmd += " OR endoca_self_q1='A' ";
                        found = true;
                    }

                    if (seer_ids.includes('27010')) {
                        cmd += " OR cervca_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('27040')) {
                        cmd += " OR ovryca_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('27030')) {
                        cmd += " OR lungca_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('35011') ||
                        seer_ids.includes('35012') ||
                        seer_ids.includes('35013') ||
                        seer_ids.includes('35014') ||
                        seer_ids.includes('35015') ||
                        seer_ids.includes('35016') ||
                        seer_ids.includes('35017') ||
                        seer_ids.includes('35018') ||
                        seer_ids.includes('35019') ||
                        seer_ids.includes('35020') ||

                        seer_ids.includes('35021') ||
                        seer_ids.includes('35022') ||
                        seer_ids.includes('35023') ||
                        seer_ids.includes('35024') ||
                        seer_ids.includes('35025') ||
                        seer_ids.includes('35026') ||
                        seer_ids.includes('35027') ||
                        seer_ids.includes('35028') ||
                        seer_ids.includes('35029') ||
                        seer_ids.includes('35030') ||

                        seer_ids.includes('35031') ||
                        seer_ids.includes('35032') ||
                        seer_ids.includes('35033') ||
                        seer_ids.includes('35034') ||
                        seer_ids.includes('35035') ||
                        seer_ids.includes('35036') ||
                        seer_ids.includes('35037') ||
                        seer_ids.includes('35038') ||
                        seer_ids.includes('35039') ||
                        seer_ids.includes('35040') ||

                        seer_ids.includes('35041') ||
                        seer_ids.includes('35042') ||
                        seer_ids.includes('35043')) {
                        cmd += " OR leuk_self_q1='A' ";
                        found = true;
                    }

                    if (seer_ids.includes('33011') || seer_ids.includes('33012')) {
                        cmd += " OR hodg_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('21041') ||
                        seer_ids.includes('21042') ||
                        seer_ids.includes('21043') ||
                        seer_ids.includes('21044') ||
                        seer_ids.includes('21045') ||
                        seer_ids.includes('21046') ||
                        seer_ids.includes('21047') ||
                        seer_ids.includes('21048') ||
                        seer_ids.includes('21049') ||
                        seer_ids.includes('21050') ||
                        seer_ids.includes('21051') ||
                        seer_ids.includes('21052') ||
                        seer_ids.includes('21053') ||
                        seer_ids.includes('21054') ||
                        seer_ids.includes('21055') ||
                        seer_ids.includes('21056') ||
                        seer_ids.includes('21057') ||
                        seer_ids.includes('21058') ||
                        seer_ids.includes('21059') ||
                        seer_ids.includes('21060')) {
                        cmd += " OR colnca_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('32010')) {
                        cmd += " OR thyrca_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('25010')) {
                        cmd += " OR meln_self_q1 = 'A' ";
                        found = true;
                    }

                    if (!found) {
                        // If user's selected cancer does NOT include SEER_ID in
                        // (26000, 27020, 27030, 27010, 27040, 22030, 35011-35043, 21041-21060, 32010, 25010),
                        // use this:
                        // If row meets user's selected cancer criteria
                        // and DATE_DT is not NULL and DATE_DT < analysis_start_date
                        // then prevalent=1
                    }

                    cmd += `)`;
                    sql = cmd;

                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.run(sql);

                    // check
                    sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name}`;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.all(sql, function (err, rows) {
                        rows.forEach(function (row) {
                            console.log(`how many panticipant: ` + JSON.stringify(row));
                        })
                    });

                    // check
                    sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name} WHERE prevalent=1 `;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.all(sql, function (err, rows) {
                        rows.forEach(function (row) {
                            console.log(`row count with prevalent=1: ` + JSON.stringify(row));
                        })
                    });

                    // Remove ALL ROWS for participants that have even just one row where prevalent=1
                    sql = `DELETE FROM ${table_name} WHERE ssap_id IN (SELECT DISTINCT ssap_id FROM ${table_name} WHERE prevalent=1)`;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.run(sql);

                    // check
                    sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name}`;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.all(sql, function (err, rows) {
                        rows.forEach(function (row) {
                            console.log(`how many panticipant after delete prevalent=1: ` + JSON.stringify(row));
                        })
                    });

                } else if (project.start_of_follow_up.start_of_follow_up_exclude === 'include all') {

                    // If DATE_DT is not NULL and DATE_DT < analysis_start_date
                    // OR brca_selfsurvey='Y'
                    // or endoca_self_q1='A'
                    // or cervca_self_q1='A'
                    // or ovryca_self_q1='A'
                    // or lungca_self_q1='A'
                    // or leuk_self_q1='A'
                    // or hodg_self_q1='A'
                    // or colnca_self_q1='A'
                    // or thyrca_self_q1='A'
                    // or meln_self_q1='A',
                    // then prevalent=1;
                    // else prevalent=0;

                    sql =
                        `UPDATE ${table_name} SET prevalent=1
                           WHERE (NOT DATE_DT is NULL and DATE_DT < analysis_start_date)
                              OR brca_selfsurvey='Y'
                              OR endoca_self_q1='A'
                              OR cervca_self_q1='A'
                              OR ovryca_self_q1='A'
                              OR lungca_self_q1='A'
                              OR leuk_self_q1='A'
                              OR hodg_self_q1='A'
                              OR colnca_self_q1='A'
                              OR thyrca_self_q1='A'
                              OR meln_self_q1='A'
                        `;
                    console.log("---------------------------------------------------")
                    console.log(sql);
                    db.run(sql);

                    // Assign ALL ROWS for participants that have even just one row meeting these conditions as prevalent=1.
                    sql =
                        `UPDATE ${table_name}
                            SET prevalent=1
                          WHERE ssap_id IN (SELECT DISTINCT ssap_id FROM ${table_name} WHERE prevalent=1)
                        `;
                    console.log("---------------------------------------------------")
                    console.log(sql);
                    db.run(sql);

                    sql = `UPDATE ${table_name} SET prevalent=0 WHERE prevalent is NULL`;
                    console.log("---------------------------------------------------")
                    console.log(sql);
                    db.run(sql);
                }
            }

            // Create a new date column called "firstselectedcancer_date."
            sql = `ALTER TABLE ${table_name} ADD COLUMN firstselectedcancer_date TEXT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            let min_dt_table_name = `${table_name}_min_dt`;
            sql = `
                CREATE TEMP TABLE ${min_dt_table_name} AS
                SELECT ssap_id, min(date_dt) as min_date_dt
                  FROM ${table_name}
                 WHERE case_indicator=1 AND NOT date_dt is NULL
                 GROUP BY ssap_id
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            //check
            sql = `SELECT count(*) FROM ${min_dt_table_name} `;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function (err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${min_dt_table_name}: ` + JSON.stringify(row));
                })
            });

            // Within rows where case_indicator=1,
            // take the DATE_DT from the first row for each participant and put it in firstselectedcancer_date.
            // All rows for a participant should have the SAME firstselectedcancer_date
            // this date should be pulled down for all rows for a participant. See image in next cell.
            // Participants who have no rows where case_indicator=1 will have a null value for this column.

            sql = `
                UPDATE ${table_name}
                   SET firstselectedcancer_date = (
                        SELECT min_date_dt
                          FROM ${min_dt_table_name}
                         WHERE ${table_name}.ssap_id = ssap_id
                       )
                  WHERE case_indicator=1
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // Create a new date column called "firstothercancer_date."
            sql = `ALTER TABLE ${table_name} ADD COLUMN firstothercancer_date TEXT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // Within rows where case_indicator=0 AND DATE_DT is NOT null
            // AND  date_dt > analysis_start_date,
            // take the DATE_DT from the first row for each participant and put it in the firstothercancer_date.

            let min_dt_other_table_name = `${table_name}_min_dt_other`;
            sql = `
                CREATE TEMP TABLE ${min_dt_other_table_name} AS
                SELECT ssap_id, min(date_dt) as min_date_dt
                  FROM ${table_name}
                 WHERE case_indicator=0 
                   AND NOT date_dt is NULL
                   AND date_dt > analysis_start_date
                 GROUP BY ssap_id
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // create an index for the table min_dt_other_table_name
            sql = `CREATE INDEX ${min_dt_other_table_name}_idx ON ${min_dt_other_table_name}(ssap_id)`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            //check
            sql = `SELECT count(*) FROM ${min_dt_other_table_name} `;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function (err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${min_dt_other_table_name}: ` + JSON.stringify(row));
                })
            });

            // All rows for a participant should have the SAME firstothercancer_date.
            // this date should be pulled down for all rows for a participant. See image in above cell.
            //
            // Participants who have no rows where case_indicator=0 and DATE_DT is not null
            // will have a null value for this column.

            sql = `
                UPDATE ${table_name}
                   SET firstothercancer_date = (
                        SELECT min_date_dt
                          FROM ${min_dt_other_table_name}
                         WHERE ${table_name}.ssap_id = ssap_id
                       )
                  WHERE case_indicator=0
                    AND NOT date_dt is NULL
                    AND date_dt > analysis_start_date
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);


            // Create a new date column called analysis_end_date.
            sql = `ALTER TABLE ${table_name} ADD COLUMN analysis_end_date TEXT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            var found = false;
            if (seer_ids.includes('27020') || seer_ids.includes('27030')) {
                // If user's selections include SEER_ID=27020 or 27030:
                // analysis_end_date=min(DATE_OF_DEATH_DT, first_moveout_ca_dt,
                // firstothercancer_date, firstselectedcancer_date, end_of_followup_date, HYSTERECTOMY_DT)

                if (project.censoring_rules && project.censoring_rules.end_of_follow_up_exclude === 'default') {

                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,    
                                   CASE 
                                      WHEN firstothercancer_date = '' OR firstothercancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstothercancer_date
                                   END,     
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN HYSTERECTOMY_DT = '' OR HYSTERECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE HYSTERECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstothercancer_date is NULL AND NOT firstothercancer_date = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT HYSTERECTOMY_DT is NULL AND NOT HYSTERECTOMY_DT = '')            
                    `;

                } else {

                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,       
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN HYSTERECTOMY_DT = '' OR HYSTERECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE HYSTERECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT HYSTERECTOMY_DT is NULL AND NOT HYSTERECTOMY_DT = '')            
                    `;
                }

                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);

                found = true;
            }

            if (seer_ids.includes('27040')) {
                // If user's selections include SEER_ID=27040:
                // analysis_end_date=min(DATE_OF_DEATH_DT,  first_moveout_ca_dt, firstothercancer_date,
                // firstselectedcancer_date, end_of_followup_date, BILATERAL_OOPHORECTOMY_DT)

                if (project.censoring_rules && project.censoring_rules.end_of_follow_up_exclude === 'default') {
                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,    
                                   CASE 
                                      WHEN firstothercancer_date = '' OR firstothercancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstothercancer_date
                                   END,     
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN BILATERAL_OOPHORECTOMY_DT = '' OR BILATERAL_OOPHORECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE BILATERAL_OOPHORECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstothercancer_date is NULL AND NOT firstothercancer_date = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT BILATERAL_OOPHORECTOMY_DT is NULL AND NOT BILATERAL_OOPHORECTOMY_DT = '')        
                    `;
                } else {
                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,         
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN BILATERAL_OOPHORECTOMY_DT = '' OR BILATERAL_OOPHORECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE BILATERAL_OOPHORECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT BILATERAL_OOPHORECTOMY_DT is NULL AND NOT BILATERAL_OOPHORECTOMY_DT = '')        
                    `;
                }

                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);

                found = true;
            }

            if (seer_ids.includes('26000')) {

                // If user's selections include SEER_ID=26000:
                // analysis_end_date=min(DATE_OF_DEATH_DT,  first_moveout_ca_dt,
                // firstothercancer_date, firstselectedcancer_date, end_of_followup_date,
                // BILATERAL_MASTECTOMY_DT)

                if (project.censoring_rules && project.censoring_rules.end_of_follow_up_exclude === 'default') {

                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,    
                                   CASE 
                                      WHEN firstothercancer_date = '' OR firstothercancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstothercancer_date
                                   END,     
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN BILATERAL_MASTECTOMY_DT = '' OR BILATERAL_MASTECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE BILATERAL_MASTECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstothercancer_date is NULL AND NOT firstothercancer_date = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT BILATERAL_MASTECTOMY_DT is NULL AND NOT BILATERAL_MASTECTOMY_DT = '')        
                    `;

                } else {

                    // If "DO NOT CENSOR AT OTHER CANCER DIAGNOSIS" was selected in the censoring rules module,
                    // "firstothercancer_date" will not be needed here either.

                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,        
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN BILATERAL_MASTECTOMY_DT = '' OR BILATERAL_MASTECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE BILATERAL_MASTECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT BILATERAL_MASTECTOMY_DT is NULL AND NOT BILATERAL_MASTECTOMY_DT = '')        
                    `;
                }

                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);

                found = true;
            }

            if (!found) {

                // If user's selections do not include SEER_ID in (27020, 27030, 27040 or 26000), use this:
                // analysis_end_date=min(DATE_OF_DEATH_DT, first_moveout_ca_dt, firstothercancer_date,
                // firstselectedcancer_date, end_of_followup_date)

                if (project.censoring_rules && project.censoring_rules.end_of_follow_up_exclude === 'default') {
                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,    
                                   CASE 
                                      WHEN firstothercancer_date = '' OR firstothercancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstothercancer_date
                                   END,     
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END)
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstothercancer_date is NULL AND NOT firstothercancer_date = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')          
                    `;
                } else {
                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,        
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END)
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')          
                    `;
                }

                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);

            }

            // check
            sql = `SELECT count(*) FROM ${table_name} WHERE NOT analysis_end_date is NULL`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function (err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} NOT analysis_end_date is NULL: ` + JSON.stringify(row));
                })
            });

            // check
            sql = `SELECT count(*) FROM ${table_name} WHERE date_dt > analysis_end_date`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function (err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} date_dt > analysis_end_date: ` + JSON.stringify(row));
                })
            });

            // Create the event variable
            sql = `ALTER TABLE ${table_name} ADD COLUMN event INT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // if analysis_end_date=end_of_followup_date then event=5
            // if analysis_end_date=DATE_OF_DEATH_DT then event=4
            // if analysis_end_date=first_moveout_ca_dt then event=3
            // if analysis_end_date=firstothercancer_date then event=2
            //
            // (add these 3 where applicable)
            // if analysis_end_date=HYSTERECTOMY_DT then event=6
            // if analysis_end_date=BILATERAL_MASTECTOMY_DT then event=7
            // if analysis_end_date=BILATERAL_OOPHORECTOMY_DT then event=8
            //
            //
            // if analysis_end_date=firstselectedcancer_date then event=1
            //
            // The order is significant because sometimes these events fall on the same day.
            // This is the prioritization order:
            // firstselectedcancer_date, (hysterectomy, bilateral mastectomy or oophorectomy dates if applicable),
            // firstothercancer_date,  first_moveout_ca_dt, date_of_death_dt, end_of_follow_up_date)

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=firstselectedcancer_date THEN 1 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT firstselectedcancer_date is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=HYSTERECTOMY_DT THEN 6 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT HYSTERECTOMY_DT is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=BILATERAL_MASTECTOMY_DT THEN 7 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT BILATERAL_MASTECTOMY_DT is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=BILATERAL_OOPHORECTOMY_DT THEN 8 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT BILATERAL_OOPHORECTOMY_DT is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=firstothercancer_date THEN 2 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT firstothercancer_date is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=first_moveout_ca_dt THEN 3 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT first_moveout_ca_dt is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=DATE_OF_DEATH_DT THEN 4 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT DATE_OF_DEATH_DT is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=end_of_followup_date THEN 5 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT end_of_followup_date is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // Remove all rows where date_dt > analysis_end_date
            sql = `DELETE FROM ${table_name} WHERE date_dt > analysis_end_date`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            // build columns
            let selected_columns = [];
            for (const [questionnarie, variables] of Object.entries(project.questionnarie)) {
                for (const [variable, value] of Object.entries(variables)) {
                    selected_columns.push(variable);
                }
            }

            //console.log("\n=========== selected_columns =============");
            //console.log(JSON.stringify(selected_columns));

            let no_need_columns = questionnarie_columns.filter(x => !selected_columns.includes(x));
            let final_columns = all_columns.filter(x => !no_need_columns.includes(x));
            final_columns = final_columns.filter(x => x !== 'breast_cancer_res_only_ind');

            console.log("\n=========== final columns =============");
            console.log(JSON.stringify(final_columns));

            // process columns
            let real_columns = "";
            for (var i = 0; i < final_columns.length; i++) {
                if (i > 0) {
                    real_columns += ", ";
                }
                real_columns += final_columns[i];
            }

            // add case_indicator
            real_columns += ", case_indicator";

            // add analysis_start_date
            real_columns += ", analysis_start_date";

            // add end_of_followup_date
            real_columns += ", end_of_followup_date";

            // add prevalent column
            if (project.start_of_follow_up.start_of_follow_up_exclude &&
                project.start_of_follow_up.start_of_follow_up_exclude === 'include all') {
                real_columns += ", prevalent ";
            }

            // add column firstselectedcancer_date
            real_columns += ", firstselectedcancer_date";

            // add column firstothercancer_date
            real_columns += ", firstothercancer_date";

            // add column analysis_end_date
            real_columns += ", analysis_end_date ";

            // add column event
            real_columns += ", event"

            console.log("\n=========== real_columns =============");
            console.log(real_columns);


            // download
            sql = `SELECT ${real_columns} FROM ${table_name}`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function (err, rows) {
                /*
                rows.forEach(function (row) {
                    console.log(`final table ${table_name} size` + JSON.stringify(row));
                })
                 */

                const json2csv = new Parser();
                const csv = json2csv.parse(rows);
                res.header('Content-Type', 'text/csv');
                res.attachment(abbrev + '_' + new Date().getTime() + '.csv');
                return res.send(csv);

            });
        });

        db.close();


        /*
        console.log("---------------------------------------------------")
        const stmt = db.prepare(sql);
        const rows = stmt.all();
        console.log("rows size = " + rows.length);
        console.log(JSON.stringify(rows, null, 2));
         */

        /*
        let table_name = `ssap_data_${id}_${abbrev}`;

        console.log("---------------------------------------------------")
        db.exec(`PRAGMA temp_store = 2`);

        // create a temporary table
        console.log("---------------------------------------------------")
        db.exec(`CREATE TEMP TABLE ${table_name} AS SELECT * FROM ssap_data_2`);

        // delete the rows with breast_cancer_res_only_ind = 1 when 26000 is not in the selection
        let seer_ids = [];
        for (var j = 0; j < project.cancer_endpoint.length; j++) {
            let item = project.cancer_endpoint[j];
            seer_ids.push(item.SEER_ID);
        }
        if (!seer_ids.includes('26000')) {
            console.log("---------------------------------------------------")
            db.exec(`DELETE FROM ${table_name} WHERE breast_cancer_res_only_ind = 1`);
        }

        // If a user selects Questionnaire 2-Questionnaire 6 as the start date,
        // remove all rows where their selected date is null.
        if (project.start_of_follow_up.start_of_follow_up.startsWith("QNR_") &&
            !project.start_of_follow_up.start_of_follow_up.startsWith("QNR_1")) {
            console.log("---------------------------------------------------")
            db.exec(`
                DELETE FROM ${table_name}
                 WHERE ${project.start_of_follow_up.start_of_follow_up} is NULL
                    OR ${project.start_of_follow_up.start_of_follow_up}=''
            `);
        }

        // Add a new column to the analytic data called analysis_start_date
        console.log("---------------------------------------------------")
        db.exec(`ALTER TABLE ${table_name} ADD COLUMN analysis_start_date TEXT`);

        // populate analysis_start_date with the user's selection
        if (project.start_of_follow_up.start_of_follow_up.startsWith("QNR_")) {
            console.log("---------------------------------------------------")
            db.exec(`UPDATE ${table_name} SET analysis_start_date=${project.start_of_follow_up.start_of_follow_up}`);
        } else if (project.start_of_follow_up.start_of_follow_up.startsWith("Other") &&
            project.start_of_follow_up.start_of_follow_up_specified) {
            let other_date = project.start_of_follow_up.start_of_follow_up_specified.split('T')[0];
            console.log("---------------------------------------------------")
            db.exec(`UPDATE ${table_name} SET analysis_start_date='${other_date}'`);
        }

        // Add a new column to the analytic data called end_of_followup_date.
        console.log("---------------------------------------------------")
        db.exec(`ALTER TABLE ${table_name} ADD COLUMN end_of_followup_date TEXT`);

        if (project.censoring_rules.through_2015_12_31) {
            // If the user answers "Yes" to the first question of censering rule,
            // populate it with the user's selection (the admin_censoring_date -- currently 12/31/2017).
            let end_date = "2017-12-31";
            console.log("---------------------------------------------------")
            db.exec(`UPDATE ${table_name} SET end_of_followup_date='${end_date}'`);
        } else if (project.censoring_rules.end_of_follow_up.startsWith("QNR_")) {
            // If the user answer "No" to the first question of censering rule and selects another date,
            // populate end_of_followup_date with their selected date.
            console.log("---------------------------------------------------")
            db.exec(`UPDATE ${table_name} SET end_of_followup_date=${project.censoring_rules.end_of_follow_up}`);
        } else if (project.censoring_rules.end_of_follow_up.startsWith("Other") &&
            project.censoring_rules.end_of_follow_up_specified) {
            // If the user answer "No" to the first question of censering rule and selects another date,
            // populate end_of_followup_date with their selected date.
            let other_date = project.censoring_rules.end_of_follow_up_specified.split('T')[0];
            console.log("---------------------------------------------------")
            db.exec(`UPDATE ${table_name} SET end_of_followup_date='${other_date}'`);
        }

        // create a new column, case_indicator
        console.log("---------------------------------------------------")
        db.exec(`ALTER TABLE ${table_name} ADD COLUMN case_indicator INT`);

        // marks rows that meet the user's endpoint definition and date_dt > analysis_start_date with a 1 and all other rows with a 0.
        console.log("---------------------------------------------------")
        db.exec(`
           UPDATE ${table_name}
              SET case_indicator=1
            WHERE date_dt > analysis_start_date
              AND ${getCoditionForCancerEndpoint(project.cancer_endpoint)}
        `);

        console.log("---------------------------------------------------")
        db.exec(`UPDATE ${table_name} SET case_indicator=0 WHERE case_indicator is NULL`);

        // add a new column prevalent
        console.log("---------------------------------------------------")
        db.exec(`ALTER TABLE ${table_name} ADD COLUMN prevalent INT`);

        if (project.start_of_follow_up.start_of_follow_up_exclude) {
            if (project.start_of_follow_up.start_of_follow_up_exclude === 'exclude all') {

                // If DATE_DT is not NULL and DATE_DT < analysis_start_date
                // OR brca_selfsurvey='Y' or endoca_self_q1='A' or cervca_self_q1='A'
                // or ovryca_self_q1='A' or lungca_self_q1='A' or leuk_self_q1='A'
                // or hodg_self_q1='A' or colnca_self_q1='A' or thyrca_self_q1='A'
                // or meln_self_q1='A', then prevalent=1

                db.exec(`UPDATE ${table_name} SET prevalent=1
                    WHERE (NOT DATE_DT is NULL and DATE_DT < analysis_start_date)
                       OR brca_selfsurvey='Y'
                       OR endoca_self_q1='A'
                       OR cervca_self_q1='A'
                       OR ovryca_self_q1='A'
                       OR lungca_self_q1='A'
                       OR leuk_self_q1='A'
                       OR hodg_self_q1='A'
                       OR colnca_self_q1='A'
                       OR thyrca_self_q1='A'
                       OR meln_self_q1='A'
                `);



            } else if (project.start_of_follow_up.start_of_follow_up_exclude === 'exclude interest') {

                let cmd =
                    `UPDATE ${table_name} SET prevalent=1
                        WHERE ${getCoditionForCancerEndpoint(project.cancer_endpoint)}
                          AND (NOT DATE_DT is NULL and DATE_DT < analysis_start_date`;

                var found = false;
                if (seer_ids.includes('26000')) {
                    // User selection includes SEER_ID=26000:
                    // If row meets the user's endpoint definition
                    // and DATE_DT is not NULL and DATE_DT < analysis_start_date
                    // OR brca_selfsurvey='Y'
                    // then prevalent=1
                    cmd += ` OR brca_selfsurvey='Y' `;
                    found = true;
                }

                if (seer_ids.includes('27020') || seer_ids.includes('27030')) {
                    cmd += " OR endoca_self_q1='A' ";
                    found = true;
                }

                if (seer_ids.includes('27010')) {
                    cmd += " OR cervca_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('27040')) {
                    cmd += " OR ovryca_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('27030')) {
                    cmd += " OR lungca_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('35011') ||
                    seer_ids.includes('35012') ||
                    seer_ids.includes('35013') ||
                    seer_ids.includes('35014') ||
                    seer_ids.includes('35015') ||
                    seer_ids.includes('35016') ||
                    seer_ids.includes('35017') ||
                    seer_ids.includes('35018') ||
                    seer_ids.includes('35019') ||
                    seer_ids.includes('35020') ||

                    seer_ids.includes('35021') ||
                    seer_ids.includes('35022') ||
                    seer_ids.includes('35023') ||
                    seer_ids.includes('35024') ||
                    seer_ids.includes('35025') ||
                    seer_ids.includes('35026') ||
                    seer_ids.includes('35027') ||
                    seer_ids.includes('35028') ||
                    seer_ids.includes('35029') ||
                    seer_ids.includes('35030') ||

                    seer_ids.includes('35031') ||
                    seer_ids.includes('35032') ||
                    seer_ids.includes('35033') ||
                    seer_ids.includes('35034') ||
                    seer_ids.includes('35035') ||
                    seer_ids.includes('35036') ||
                    seer_ids.includes('35037') ||
                    seer_ids.includes('35038') ||
                    seer_ids.includes('35039') ||
                    seer_ids.includes('35040') ||

                    seer_ids.includes('35041') ||
                    seer_ids.includes('35042') ||
                    seer_ids.includes('35043')) {
                    cmd += " OR leuk_self_q1='A' ";
                    found = true;
                }

                if (seer_ids.includes('33011') || seer_ids.includes('33012')) {
                    cmd += " OR hodg_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('21041') ||
                    seer_ids.includes('21042') ||
                    seer_ids.includes('21043') ||
                    seer_ids.includes('21044') ||
                    seer_ids.includes('21045') ||
                    seer_ids.includes('21046') ||
                    seer_ids.includes('21047') ||
                    seer_ids.includes('21048') ||
                    seer_ids.includes('21049') ||
                    seer_ids.includes('21050') ||
                    seer_ids.includes('21051') ||
                    seer_ids.includes('21052') ||
                    seer_ids.includes('21053') ||
                    seer_ids.includes('21054') ||
                    seer_ids.includes('21055') ||
                    seer_ids.includes('21056') ||
                    seer_ids.includes('21057') ||
                    seer_ids.includes('21058') ||
                    seer_ids.includes('21059') ||
                    seer_ids.includes('21060')) {
                    cmd += " OR colnca_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('32010')) {
                    cmd += " OR thyrca_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('25010')) {
                    cmd += " OR meln_self = 'A' ";
                    found = true;
                }

                if (!found) {
                    // If user's selected cancer does NOT include SEER_ID in
                    // (26000, 27020, 27030, 27010, 27040, 22030, 35011-35043, 21041-21060, 32010, 25010),
                    // use this:
                    // If row meets user's selected cancer criteria
                    // and DATE_DT is not NULL and DATE_DT < analysis_start_date
                    // then prevalent=1
                }

                cmd += `)`;
                db.exec(`${cmd}`);

                let sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name}`;
                let stmt = db.prepare(sql);
                let rows = stmt.all();
                console.log(JSON.stringify(rows, null, 2));

                sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name} WHERE prevalent=1 `;
                stmt = db.prepare(sql);
                rows = stmt.all();
                console.log(JSON.stringify(rows, null, 2));

                // Remove ALL ROWS for participants that have even just one row where prevalent=1
                db.exec(`DELETE FROM ${table_name} WHERE ssap_id IN (SELECT DISTINCT ssap_id FROM ${table_name} WHERE prevalent=1)`);

                sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name}`;
                stmt = db.prepare(sql);
                rows = stmt.all();
                console.log(JSON.stringify(rows, null, 2));

            } else if (project.start_of_follow_up.start_of_follow_up_exclude === 'include all') {

                // If DATE_DT is not NULL and DATE_DT < analysis_start_date
                // OR brca_selfsurvey='Y'
                // or endoca_self_q1='A'
                // or cervca_self_q1='A'
                // or ovryca_self_q1='A'
                // or lungca_self_q1='A'
                // or leuk_self_q1='A'
                // or hodg_self_q1='A'
                // or colnca_self_q1='A'
                // or thyrca_self_q1='A'
                // or meln_self_q1='A',
                // then prevalent=1;
                // else prevalent=0;

                db.exec(`UPDATE ${table_name} SET prevalent=1
                    WHERE (NOT DATE_DT is NULL and DATE_DT < analysis_start_date)
                       OR brca_selfsurvey='Y'
                       OR endoca_self_q1='A'
                       OR cervca_self_q1='A'
                       OR ovryca_self_q1='A'
                       OR lungca_self_q1='A'
                       OR leuk_self_q1='A'
                       OR hodg_self_q1='A'
                       OR colnca_self_q1='A'
                       OR thyrca_self_q1='A'
                       OR meln_self_q1='A'
                `);

                // Assign ALL ROWS for participants that have even just one row meeting these conditions as prevalent=1.
                db.exec(
                    `UPDATE ${table_name}
                        SET prevalent=1
                      WHERE ssap_id IN (SELECT DISTINCT ssap_id FROM ${table_name} WHERE prevalent=1)
                `);

                console.log("---------------------------------------------------")
                db.exec(`UPDATE ${table_name} SET prevalent=0 WHERE prevalent is NULL`);

            }
        }

        // Create a new date column called "firstselectedcancer_date."
        console.log("---------------------------------------------------")
        db.exec(`ALTER TABLE ${table_name} ADD COLUMN firstselectedcancer_date TEXT`);

        let min_dt_table_name = `${table_name}_min_dt`
        db.exec(
            `CREATE TEMP TABLE ${min_dt_table_name} AS
                SELECT ssap_id, min(date_dt) as min_date_dt
                  FROM ${table_name}
                 WHERE case_indicator=1 AND NOT date_dt is NULL
                 GROUP BY ssap_id
        `);

        let sql1 = `SELECT count(*) FROM ${min_dt_table_name} `;
        let stmt1 = db.prepare(sql1);
        let rows1 = stmt1.all();
        console.log(JSON.stringify(rows1, null, 2));

        // Within rows where case_indicator=1,
        // take the DATE_DT from the first row for each participant and put it in firstselectedcancer_date.
        // All rows for a participant should have the SAME firstselectedcancer_date
        // this date should be pulled down for all rows for a participant. See image in next cell.
        // Participants who have no rows where case_indicator=1 will have a null value for this column.

        db.exec(
            `UPDATE ${table_name}
                SET firstselectedcancer_date = (
                        SELECT min_date_dt
                          FROM ${min_dt_table_name}
                         WHERE ${table_name}.ssap_id = ssap_id
                    )
              WHERE case_indicator=1
        `);

        sql1 = `
           SELECT ssap_id,
                  seer_id, icd_o3_cde,
                  histologic_icdo3_typ,
                  QNR_2_FILL_DT,
                  date_dt,
                  case_indicator,
                  firstselectedcancer_date
             FROM ${table_name}
            WHERE ssap_id = 90558938
            ORDER BY ssap_id
            LIMIT 100
         `;
        stmt1 = db.prepare(sql1);
        rows1 = stmt1.all();
        console.log(JSON.stringify(rows1, null, 2));
         */


        // query the table to get data
        /*
        let table_name = 'ssap_data_2';
        sql = `SELECT count(DISTINCT ssap_id) as total FROM ${table_name}`;
        console.log("---------------------------------------------------")
        const stmt = db.prepare(sql);
        const rows = stmt.all();
        console.log("rows size = " + rows.length);
        console.log(JSON.stringify(rows, null, 2));
         */

        /*
        let new_rows = [];
        for (var i = 0; i < rows.length; i++) {
            let row = rows[i];
            let new_row = {...row};
            for (const [key, value] of Object.entries(row)) {
                //console.log(`${key}: ${value}`);
                if (value === '' || value === 'undefined' || value === 'Undefined') {
                    new_row[key] = undefined;
                } else {
                    let tmp = Number(value);
                    if (!isNaN(tmp)) {
                        new_row[key] = tmp;
                    }
                }
            }
            new_rows.push(new_row);
        }
         */

        // drop the table
        // console.log("---------------------------------------------------")
        //db.exec(`DROP TABLE ${table_name}`);

        /*
        const json2csv = new Parser();
        const csv = json2csv.parse(new_rows);
        res.header('Content-Type', 'text/csv');
        res.attachment(abbrev + '_' + new Date().getTime() + '.csv');
        return res.send(csv);
         */

    });

    /*
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', 'attachment; filename=' + abbrev + '_' + new Date().getTime() + '.csv');
    res.send(rows);
     */

    /*
    sequelize.query(sql)
        .then(result => {
            res.set('Content-Type', 'application/octet-stream');
            res.set('Content-Disposition', 'attachment; filename=' + abbrev + '_' + new Date().getTime() + '.csv');
            res.send(result[0]);
        });
    */

});

app.listen(3001, () =>
    console.log('Express server is running on localhost:3001')
);
