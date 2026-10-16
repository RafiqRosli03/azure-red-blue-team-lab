# Architecture

![Azure Red Team and Blue Team private ACI lab architecture](lab-architecture.png)

This diagram documents the private Option A deployment: Kali, DVWA, and Juice Shop run as
VNet-integrated Azure Container Instances with no public ingress. The telemetry plane sends
ACI diagnostics, Azure Activity Log, and planned Microsoft Entra ID logs to Log Analytics,
Microsoft Sentinel, and Defender for Cloud before following the SOC response workflow.

## Diagram files

- `lab-architecture.drawio` — editable diagrams.net source.
- `lab-architecture.svg` — scalable GitHub/browser rendering.
- `lab-architecture.png` — 2x raster export used by the root README.
- `generate-diagram.cjs` — local generator for the embedded-icon source and standalone SVG.

Open `lab-architecture.drawio` in [app.diagrams.net](https://app.diagrams.net/) or the draw.io
desktop application. The official service SVGs are embedded directly in the draw.io cell
styles as data URIs, so the source is self-contained and does not depend on an enabled stencil
library or external asset paths.

## Official Microsoft icons

Azure service icons come from Microsoft's [Azure Architecture Icons](https://learn.microsoft.com/en-us/azure/architecture/icons/)
page and the official **Azure Public Service Icons V24** package. The Microsoft Entra ID icon
comes from Microsoft's [Microsoft Entra architecture icons](https://learn.microsoft.com/en-us/entra/architecture/architecture-icons)
package. Azure and Microsoft Entra icons © Microsoft; used unaltered to depict Microsoft
services in this architecture under the icon terms on those official pages.

The analyst uses the portable built-in draw.io `actor` shape. The Azure Cloud heading uses the
official Azure Subscriptions icon because the public service package does not provide a generic
Azure-cloud logo.

## Re-export

From the repository root, regenerate the self-contained draw.io source and standalone SVG:

```powershell
node "architecture/generate-diagram.cjs"
```

Then export a 3400×2300 PNG from the 1700×1150 SVG at 2x density:

```powershell
npx --yes sharp-cli@6.1.0 -i "architecture/lab-architecture.svg" -o "architecture" --format png --density 144
```

The PNG command uses pinned `sharp-cli` 6.1.0 through `npx`; it does not add a dependency to
this project. You can also export PNG or SVG from diagrams.net after editing, but keep the
embedded data-URI icon styles intact.

## Design rationale

- **One resource group** enables single-command teardown for cost control.
- **Private ACI subnets** isolate the attacker and intentionally vulnerable workloads.
- **NSG isolation** permits victim ingress only from `snet-attacker` and denies all other ingress.
- **One Log Analytics workspace** supports cross-table KQL and Microsoft Sentinel detections.
- **Defender for Cloud free CSPM** provides Secure Score without exposing the lab publicly.
