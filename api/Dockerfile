FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore ./src/Aura.WebApi/Aura.WebApi.csproj
RUN dotnet publish ./src/Aura.WebApi/Aura.WebApi.csproj -c Release -o /app
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:5187
EXPOSE 5187
ENTRYPOINT ["dotnet","Aura.WebApi.dll"]
