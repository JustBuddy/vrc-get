use crate::commands::{absolute_path, ResultExt};
use clap::{Parser, Subcommand};
use log::warn;
use std::cmp::Reverse;
use std::path::Path;
use vrc_get_vpm::environment::{find_unity_hub, Settings, VccDatabaseConnection};
use vrc_get_vpm::io::{DefaultEnvironmentIo, DefaultProjectIo};
use vrc_get_vpm::{unity_hub, UnityProject};

/// Experimental VCC commands
#[derive(Subcommand)]
#[command(author, version)]
pub enum Vcc {
    #[command(subcommand)]
    Project(Project),
    #[command(subcommand)]
    Unity(Unity),
}

impl Vcc {
    pub async fn run(self) {
        warn!("vrc-get vcc is experimental and may change in the future!");
        self.run_inner().await;
    }
}

multi_command!(fn run_inner Vcc is Project, Unity);

/// Vcc Project Commands
#[derive(Subcommand)]
#[command(author, version)]
pub enum Project {
    List(ProjectList),
    Add(ProjectAdd),
    Remove(ProjectRemove),
}

multi_command!(Project is List, Add, Remove);

async fn migrate_sanitize_projects(
    connection: &mut VccDatabaseConnection,
    io: &DefaultEnvironmentIo,
    settings: &Settings,
) {
    // migrate from settings json
    connection
        .migrate(settings, io)
        .await
        .exit_context("migrating from settings.json");
    connection
        .dedup_projects()
        .exit_context("deduplicating projects in DB");
}

/// List projects
#[derive(Parser)]
#[command(author, version)]
pub struct ProjectList {
    #[command(flatten)]
    env_args: super::EnvArgs,
}

impl ProjectList {
    pub async fn run(self) {
        let io = DefaultEnvironmentIo::new_default();
        let settings = Settings::load(&io).await.exit_context("loading settings");

        let mut connection = VccDatabaseConnection::connect(&io)
            .await
            .exit_context("connecting to database");

        migrate_sanitize_projects(&mut connection, &io, &settings).await;

        connection
            .sync_with_real_projects(false, &io)
            .await
            .exit_context("syncing with real projects");

        let mut projects = connection.get_projects().exit_context("getting projects");

        projects.sort_by_key(|x| Reverse(x.last_modified().timestamp_millis()));

        for project in projects.iter() {
            let path = project.path();
            // TODO: use '/' for unix
            let name = project.name();
            let unity_version = project
                .unity_version()
                .map(|x| x.to_string())
                .unwrap_or("unknown".into());

            println!("{name}:");
            println!("  Path: {}", path);
            println!("  Unity: {unity_version}");
            println!("  Target: {}", project.project_type());
            println!("  Is Favorite: {}", project.favorite());
        }
    }
}

/// Add Project to vpm project management
#[derive(Parser)]
#[command(author, version)]
pub struct ProjectAdd {
    #[command(flatten)]
    env_args: super::EnvArgs,
    path: Box<str>,
}

impl ProjectAdd {
    pub async fn run(self) {
        let io = DefaultEnvironmentIo::new_default();
        let mut settings = Settings::load(&io).await.exit_context("loading settings");
        let mut connection = VccDatabaseConnection::connect(&io)
            .await
            .exit_context("connecting to database");

        let project_path = absolute_path(Path::new(self.path.as_ref()));
        let project_io = DefaultProjectIo::new(project_path.into());
        let project = UnityProject::load(project_io)
            .await
            .exit_context("loading specified project");

        if !project.is_valid().await {
            return eprintln!("Invalid project at {}", self.path);
        }

        migrate_sanitize_projects(&mut connection, &io, &settings).await;

        connection
            .add_project(&project)
            .await
            .exit_context("adding project");

        connection.save(&io).await.exit_context("saving database");
        settings
            .load_from_db(&connection)
            .exit_context("saving database");
        settings.save(&io).await.exit_context("saving settings");
    }
}

/// Remove Project from vpm project management
#[derive(Parser)]
#[command(author, version)]
pub struct ProjectRemove {
    #[command(flatten)]
    env_args: super::EnvArgs,
    path: Box<str>,
}

impl ProjectRemove {
    pub async fn run(self) {
        let io = DefaultEnvironmentIo::new_default();
        let mut settings = Settings::load(&io).await.exit_context("loading settings");
        let mut connection = VccDatabaseConnection::connect(&io)
            .await
            .exit_context("connecting to database");

        let Some(project) = connection
            .get_projects()
            .exit_context("getting projects")
            .into_iter()
            .find(|x| x.path() == self.path.as_ref())
        else {
            return println!("No project found at {}", self.path);
        };

        migrate_sanitize_projects(&mut connection, &io, &settings).await;

        connection
            .remove_project(&project)
            .exit_context("removing project");

        connection.save(&io).await.exit_context("saving database");
        settings
            .load_from_db(&connection)
            .exit_context("saving database");
        settings.save(&io).await.exit_context("saving environment");
    }
}

/// Vcc Unity Management Commands
#[derive(Subcommand)]
#[command(author, version)]
pub enum Unity {
    List(UnityList),
    Add(UnityAdd),
    Remove(UnityRemove),
    Update(UnityUpdate),
}

multi_command!(Unity is List, Add, Remove, Update);

/// List registered Unity installations
#[derive(Parser)]
#[command(author, version)]
pub struct UnityList {
    #[command(flatten)]
    env_args: super::EnvArgs,
}

impl UnityList {
    pub async fn run(self) {
        let io = DefaultEnvironmentIo::new_default();
        let connection = VccDatabaseConnection::connect(&io)
            .await
            .exit_context("connecting to database");

        let mut unity_installations = connection
            .get_unity_installations()
            .exit_context("getting installations");

        unity_installations.sort_by_key(|x| Reverse(x.version()));

        for unity in unity_installations.iter() {
            if let Some(unity_version) = unity.version() {
                println!("version {} at {}", unity_version, unity.path());
            } else {
                println!("unknown version at {}", unity.path());
            }
        }
    }
}

/// Add Unity installation to the list
#[derive(Parser)]
#[command(author, version)]
pub struct UnityAdd {
    #[command(flatten)]
    env_args: super::EnvArgs,
    path: Box<str>,
}

impl UnityAdd {
    pub async fn run(self) {
        let io = DefaultEnvironmentIo::new_default();
        let mut connection = VccDatabaseConnection::connect(&io)
            .await
            .exit_context("connecting to database");

        let unity_version = vrc_get_vpm::unity::call_unity_for_version(self.path.as_ref().as_ref())
            .await
            .exit_context("calling unity for version");

        connection
            .add_unity_installation(self.path.as_ref(), unity_version)
            .await
            .exit_context("adding unity installation");

        connection.save(&io).await.exit_context("saving database");

        println!("Added version {} at {}", unity_version, self.path);
    }
}

/// Remove specified Unity installation from the list
#[derive(Parser)]
#[command(author, version)]
pub struct UnityRemove {
    #[command(flatten)]
    env_args: super::EnvArgs,
    path: Box<str>,
}

impl UnityRemove {
    pub async fn run(self) {
        let io = DefaultEnvironmentIo::new_default();
        let mut connection = VccDatabaseConnection::connect(&io)
            .await
            .exit_context("connecting to database");

        let Some(unity) = connection
            .get_unity_installations()
            .exit_context("getting installations")
            .into_iter()
            .find(|x| x.path() == self.path.as_ref())
        else {
            return eprintln!("No unity installation found at {}", self.path);
        };

        connection
            .remove_unity_installation(&unity)
            .await
            .exit_context("adding unity installation");

        connection.save(&io).await.exit_context("saving database");
    }
}

/// Update Unity installation list from file system and Unity Hub.
///
/// If the installation is not found in the file system, it will be removed from the list.
/// If the installation is found from Unity Hub, it will be added to the list.
#[derive(Parser)]
#[command(author, version)]
pub struct UnityUpdate {
    #[command(flatten)]
    env_args: super::EnvArgs,
}

impl UnityUpdate {
    pub async fn run(self) {
        let io = DefaultEnvironmentIo::new_default();
        let mut settings = Settings::load(&io).await.exit_context("loading settings");

        let unity_hub_path = find_unity_hub(&mut settings, &io)
            .await
            .exit_context("loading unity hub path")
            .unwrap_or_else(|| exit_with!("Unity Hub not found"));

        let paths_from_hub = unity_hub::get_unity_from_unity_hub(unity_hub_path.as_ref())
            .await
            .exit_context("loading unity list from unity hub");

        let mut connection = VccDatabaseConnection::connect(&io)
            .await
            .exit_context("connecting to database");
        connection
            .update_unity_from_unity_hub_and_fs(&paths_from_hub, &io)
            .await
            .exit_context("updating unity from unity hub");

        connection.save(&io).await.exit_context("saving database");
        settings.save(&io).await.exit_context("saving settings");
    }
}
